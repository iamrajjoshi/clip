import { defineCollection } from "astro:content";
import { clipDataSchema } from "@/content/schema";

const clips = defineCollection({
  type: "content",
  schema: clipDataSchema,
});

export const collections = { clips };
