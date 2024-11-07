import { Question } from "@/types/recording";

interface ResponsesSummaryProps {
  questions: Question[];
  transcriptions: Record<string, string>;
  currentStep: number;
  allResponsesComplete: boolean;
}

export function ResponsesSummary({ 
  questions, 
  transcriptions, 
  currentStep, 
  allResponsesComplete 
}: ResponsesSummaryProps) {
  return (
    <div className="p-6">
      <h3 className="text-lg font-semibold mb-4">Your Responses</h3>
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              {question.text}
            </p>
            {transcriptions[question.key] ? (
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{transcriptions[question.key]}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                {currentStep >= question.id
                  ? "Recording pending..."
                  : "Not recorded yet"}
              </p>
            )}
          </div>
        ))}
      </div>

      {allResponsesComplete && (
        <div className="mt-6 p-4 bg-muted rounded-md">
          <p className="text-sm font-medium text-green-600">
            ✓ All responses completed!
          </p>
        </div>
      )}
    </div>
  );
} 