import { z } from "zod";

const slugList = z.array(z.string().trim().min(1).max(64)).max(50);

const weight = z.number().min(0).max(100);

export const profilePayloadSchema = z.object({
  complete: z.boolean().optional().default(false),
  travelerTypes: slugList.default([]),
  requirements: z
    .object({
      mobility: slugList.default([]),
      visual: slugList.default([]),
      hearing: slugList.default([]),
    })
    .default({ mobility: [], visual: [], hearing: [] }),
  details: z
    .object({
      mobility: z.string().max(1000).default(""),
      dietary: z.string().max(1000).default(""),
    })
    .default({ mobility: "", dietary: "" }),
  dietary: slugList.default([]),
  preferences: z
    .object({
      sustainability: weight,
      accessibility: weight,
      budget: weight,
      time: weight,
      comfort: weight,
    })
    .default({
      sustainability: 50,
      accessibility: 50,
      budget: 50,
      time: 50,
      comfort: 50,
    }),
  specialRequirement: z.string().max(2000).default(""),
});

export type ProfilePayload = z.infer<typeof profilePayloadSchema>;
