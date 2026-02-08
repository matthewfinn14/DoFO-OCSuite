/**
 * Cloud Function to analyze whiteboard football play diagrams using Claude Vision.
 *
 * This function:
 * 1. Receives an image URL from Firebase Storage
 * 2. Checks rate limits for the school
 * 3. Calls Claude Vision API to analyze the diagram
 * 4. Normalizes coordinates to WIZ canvas format
 * 5. Returns structured elements for the diagram editor
 */

import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import Anthropic from "@anthropic-ai/sdk";
import { WHITEBOARD_ANALYSIS_PROMPT, WhiteboardAnalysisResult } from "./prompts/whiteboardAnalysis";
import { normalizeCoordinates, NormalizedResult } from "./utils/coordinateNormalizer";
import { parseAndValidate, isValidAnalysis } from "./utils/elementValidator";

// Define the Anthropic API key as a secret
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

// Rate limit constants
const DAILY_LIMIT = 50;
const MONTHLY_LIMIT = 500;

interface AnalyzeRequest {
  imageUrl: string;
  schoolId: string;
}

interface AnalyzeResponse {
  success: boolean;
  data?: NormalizedResult;
  rawAnalysis?: WhiteboardAnalysisResult;
  error?: string;
  rateLimitRemaining?: {
    daily: number;
    monthly: number;
  };
}

/**
 * Check and update rate limits for the school.
 * Returns remaining limits or throws if exceeded.
 */
async function checkRateLimits(
  schoolId: string
): Promise<{ daily: number; monthly: number }> {
  const db = admin.firestore();
  const now = new Date();
  const today = now.toISOString().split("T")[0]; // YYYY-MM-DD
  const month = today.slice(0, 7); // YYYY-MM

  const usageRef = db.collection("schools").doc(schoolId).collection("usage").doc("whiteboard");
  const usageDoc = await usageRef.get();
  const usage = usageDoc.data() || {};

  // Check daily limit
  const dailyUsage = usage[`daily_${today}`] || 0;
  if (dailyUsage >= DAILY_LIMIT) {
    throw new HttpsError("resource-exhausted", `Daily limit of ${DAILY_LIMIT} conversions reached. Try again tomorrow.`);
  }

  // Check monthly limit
  const monthlyUsage = usage[`monthly_${month}`] || 0;
  if (monthlyUsage >= MONTHLY_LIMIT) {
    throw new HttpsError("resource-exhausted", `Monthly limit of ${MONTHLY_LIMIT} conversions reached.`);
  }

  // Increment usage
  await usageRef.set({
    [`daily_${today}`]: dailyUsage + 1,
    [`monthly_${month}`]: monthlyUsage + 1,
    lastUsed: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  return {
    daily: DAILY_LIMIT - dailyUsage - 1,
    monthly: MONTHLY_LIMIT - monthlyUsage - 1,
  };
}

/**
 * Fetch image from URL and convert to base64.
 */
async function fetchImageAsBase64(imageUrl: string): Promise<{ base64: string; mediaType: string }> {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    throw new HttpsError("not-found", "Could not fetch the image");
  }

  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  // Map content type to Anthropic's expected format
  let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
  if (contentType.includes("png")) {
    mediaType = "image/png";
  } else if (contentType.includes("gif")) {
    mediaType = "image/gif";
  } else if (contentType.includes("webp")) {
    mediaType = "image/webp";
  }

  return { base64, mediaType };
}

export const analyzeWhiteboard = onCall(
  {
    secrets: [anthropicApiKey],
    region: "us-central1",
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: "512MiB",
  },
  async (request): Promise<AnalyzeResponse> => {
    // Verify authentication
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { imageUrl, schoolId } = request.data as AnalyzeRequest;

    if (!imageUrl || !schoolId) {
      throw new HttpsError("invalid-argument", "imageUrl and schoolId are required");
    }

    // Check rate limits
    let rateLimitRemaining: { daily: number; monthly: number };
    try {
      rateLimitRemaining = await checkRateLimits(schoolId);
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Failed to check rate limits");
    }

    // Fetch the image
    let imageData: { base64: string; mediaType: string };
    try {
      imageData = await fetchImageAsBase64(imageUrl);
    } catch (error) {
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Failed to fetch image");
    }

    // Initialize Anthropic client
    const anthropic = new Anthropic({
      apiKey: anthropicApiKey.value(),
    });

    // Call Claude Vision API
    let rawResponse: string;
    try {
      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: imageData.mediaType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
                  data: imageData.base64,
                },
              },
              {
                type: "text",
                text: WHITEBOARD_ANALYSIS_PROMPT,
              },
            ],
          },
        ],
      });

      // Extract text response
      const textContent = message.content.find((c) => c.type === "text");
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
      }
      rawResponse = textContent.text;
    } catch (error) {
      console.error("Claude API error:", error);
      throw new HttpsError("internal", "Failed to analyze image with AI");
    }

    // Parse and validate the response
    let analysis: WhiteboardAnalysisResult;
    try {
      analysis = parseAndValidate(rawResponse);
    } catch (error) {
      console.error("Parse error:", error);
      return {
        success: false,
        error: "Failed to parse AI analysis results. The image may be too unclear.",
        rateLimitRemaining,
      };
    }

    // Check if the analysis is valid enough
    const validity = isValidAnalysis(analysis);
    if (!validity.valid) {
      return {
        success: false,
        error: validity.reason,
        rawAnalysis: analysis,
        rateLimitRemaining,
      };
    }

    // Normalize coordinates to WIZ canvas format
    const normalizedData = normalizeCoordinates(analysis);

    return {
      success: true,
      data: normalizedData,
      rawAnalysis: analysis,
      rateLimitRemaining,
    };
  }
);
