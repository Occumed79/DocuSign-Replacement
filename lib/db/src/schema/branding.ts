import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

// Per-clinic white-label branding configuration
export const clinicBrandingTable = pgTable("clinic_branding", {
  id: serial("id").primaryKey(),
  clinicName: text("clinic_name").notNull(),
  logoUrl: text("logo_url"), // URL to uploaded logo image
  primaryColor: text("primary_color").notNull().default("#2563eb"), // hex color
  accentColor: text("accent_color").notNull().default("#7c3aed"),
  emailFromName: text("email_from_name").notNull().default("PacketPath"),
  emailFromAddress: text("email_from_address"),
  emailFooterText: text("email_footer_text"),
  signingPageTagline: text("signing_page_tagline"),
  faviconUrl: text("favicon_url"),
  isDefault: boolean("is_default").notNull().default(false),
  createdById: integer("created_by_id").references(() => usersTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type ClinicBranding = typeof clinicBrandingTable.$inferSelect;
