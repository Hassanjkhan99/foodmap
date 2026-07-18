/**
 * Ordered, additive migrations for the FoodMap PostGIS catalog. Never edit a
 * shipped migration — append a new one. Applied by runMigrations().
 */
export interface Migration {
  readonly id: string;
  readonly sql: string;
}

export const MIGRATIONS: readonly Migration[] = [
  {
    id: "0001_init",
    sql: /* sql */ `
      CREATE EXTENSION IF NOT EXISTS postgis;

      CREATE TABLE IF NOT EXISTS restaurant_brand (
        id          text PRIMARY KEY,
        name        text NOT NULL,
        created_at  timestamptz NOT NULL DEFAULT now(),
        updated_at  timestamptz NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS venue (
        id                        text PRIMARY KEY,
        brand_id                  text NOT NULL REFERENCES restaurant_brand(id),
        name                      text NOT NULL,
        geom                      geography(Point, 4326) NOT NULL,
        cuisines                  text[] NOT NULL DEFAULT '{}',
        open_state                text NOT NULL,
        opens_at_label            text,
        source                    text NOT NULL,
        delivery_restaurant_slug  text,
        delivery_branch_id        text,
        distinguishing_fact       text,
        created_at                timestamptz NOT NULL DEFAULT now(),
        updated_at                timestamptz NOT NULL DEFAULT now()
      );

      -- Spatial index for corridor / radius prefiltering.
      CREATE INDEX IF NOT EXISTS venue_geom_gix ON venue USING gist (geom);

      CREATE TABLE IF NOT EXISTS external_place_ref (
        id                text PRIMARY KEY,
        venue_id          text NOT NULL REFERENCES venue(id) ON DELETE CASCADE,
        provider          text NOT NULL,
        external_id       text NOT NULL,
        status            text NOT NULL DEFAULT 'active',
        last_validated_at timestamptz,
        UNIQUE (provider, external_id)
      );

      CREATE TABLE IF NOT EXISTS venue_attribute (
        id            bigserial PRIMARY KEY,
        venue_id      text NOT NULL REFERENCES venue(id) ON DELETE CASCADE,
        key           text NOT NULL,
        value         jsonb NOT NULL,
        schema_version int NOT NULL DEFAULT 1,
        source_type   text NOT NULL,
        source_ref    text,
        observed_at   timestamptz,
        verified_at   timestamptz,
        expires_at    timestamptz
      );
      CREATE INDEX IF NOT EXISTS venue_attribute_venue_key_ix
        ON venue_attribute (venue_id, key);
    `,
  },
];
