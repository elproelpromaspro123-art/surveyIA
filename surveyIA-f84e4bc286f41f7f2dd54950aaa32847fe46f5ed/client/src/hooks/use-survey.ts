import { useMutation } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

type GenerateSurveyInput = z.infer<typeof api.survey.generate.input>;

export function useGenerateSurveyResponse() {
  return useMutation({
    mutationFn: async (data: GenerateSurveyInput) => {
      const validated = api.survey.generate.input.parse(data);
      const res = await fetch(api.survey.generate.path, {
        method: api.survey.generate.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
      });

      if (!res.ok) {
        if (res.status === 500) {
          const error = api.survey.generate.responses[500].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to generate response");
      }
      
      return api.survey.generate.responses[200].parse(await res.json());
    },
  });
}
