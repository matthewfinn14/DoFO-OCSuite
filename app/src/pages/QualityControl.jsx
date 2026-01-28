import { useParams } from 'react-router-dom';
import { useSchool } from '../context/SchoolContext';
import XOQualityControl from '../components/weekly/XOQualityControl';

export default function QualityControl() {
  const { weekId } = useParams();
  const { setCurrentWeekId } = useSchool();

  // Set the current week context if weekId is provided
  if (weekId) {
    setCurrentWeekId(weekId);
  }

  return (
    <div className="h-full">
      <XOQualityControl weekId={weekId} expanded={true} />
    </div>
  );
}
