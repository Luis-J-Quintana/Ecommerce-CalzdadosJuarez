import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20261018204454 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "wholesale_setting" ("id" text not null, "threshold" integer not null default 15, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "wholesale_setting_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_wholesale_setting_deleted_at" ON "wholesale_setting" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "wholesale_setting" cascade;`);
  }

}
