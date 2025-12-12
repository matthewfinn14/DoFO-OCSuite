import json

def parse_time(t_str):
    try:
        m, s = map(int, t_str.split(':'))
        return m * 60 + s
    except:
        return 0

def parse_file(filename):
    with open(filename, 'r') as f:
        lines = f.readlines()

    header = lines[0].strip().split('\t')
    weights = [int(x) for x in header if x.strip()] # 100, 110, ...

    data = []
    
    # Process rows
    for line in lines[1:]:
        parts = line.strip().split('\t')
        if not parts: continue
        
        time_str = parts[0]
        seconds = parse_time(time_str)
        
        scores = []
        for p in parts[1:]:
            try:
                scores.append(int(p))
            except ValueError:
                scores.append(0)
        
        # Ensure scores length matches weights
        # If row is shorter, pad with last value or 0? 
        # The prompt data looks rectangular but tabs might be tricky.
        # Let's trust the split.
        
        entry = {
            "time": time_str,
            "seconds": seconds,
            "scores": scores
        }
        data.append(entry)

    return {"weights": weights, "rows": data}

result = parse_file('raw_800m_scores.txt')
print(json.dumps(result, indent=2))
