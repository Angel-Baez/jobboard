import {
  pgTable,
  text,
  varchar,
  integer,
  index,
} from "drizzle-orm/pg-core";
import { timestamps } from "./_shared";
import { fileTypeEnum } from "./enums";
import { users } from "./users";

export const files = pgTable(
  "files",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    uploadedById: text("uploaded_by_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: fileTypeEnum("type").notNull(),
    storageKey: varchar("storage_key", { length: 500 }).notNull().unique(),
    url: varchar("url", { length: 1000 }).notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 100 }).notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    ...timestamps,
  },
  (t) => [
    index("files_uploader_idx").on(t.uploadedById),
    index("files_type_idx").on(t.type),
  ]
);

export type File = typeof files.$inferSelect;
export type NewFile = typeof files.$inferInsert;
