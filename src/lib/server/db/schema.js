import { pgTable, text, integer, timestamp, customType, serial, uniqueIndex } from 'drizzle-orm/pg-core';

const bytea = customType({
  dataType() {
    return 'bytea';
  },
});


export const task = pgTable('task', {
	id: serial('id').primaryKey(),
	title: text('title').notNull(),
	priority: integer('priority').notNull().default(1)
});

export const files = pgTable(
  "files",
  {
    id: text("id").primaryKey(),
    bucket: text("bucket").notNull(), // Bucket name to which the file belongs
    userId: text("user_id").notNull(), // Uploader of the file
    name: text("name").notNull(), // Original file name
    data: bytea("data").notNull(), // File data stored as bytea
    mimeType: text("mime_type").notNull(), // MIME type of the file
    size: integer("size").notNull(), // File size in bytes
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("files_bucket_name_unique").on(table.bucket, table.name),
  ],
);

export const buckets = pgTable(
  "buckets",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(), // Owner of the bucket
    name: text("name").notNull(), // Bucket name
    publication: text("publication").notNull(), // e.g., "public" or "private"
    accessList: text("access_list").array(), // Array of user IDs who have access to this bucket (for private buckets)
    createdAt: timestamp("created_at").defaultNow(),
  },
  (table) => [
    uniqueIndex("buckets_user_name_unique").on(table.name),
  ],
);

export *  from './auth.schema';
