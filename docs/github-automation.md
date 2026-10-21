# GitHub automation

## Quality checks

The `quality.yml` workflow runs unit tests, knowledge-data validation, retrieval evaluation, and JavaScript syntax checks on pushes and pull requests. It uses GitHub-hosted runners, not the user's laptop.

## Supabase migration deployment

The `supabase-deploy.yml` workflow watches `supabase/migrations/**`. It validates the migration directory on every matching push. It applies migrations only when all three repository Actions secrets are configured:

- `SUPABASE_ACCESS_TOKEN`: Supabase personal access token.
- `SUPABASE_DB_PASSWORD`: database password for that project.

The existing project reference is set in the workflow; only the access token and database password need to be stored as secrets. If either secret is missing, deployment is skipped and the quality checks still run. No secret values belong in source code, migration files, logs, or chat messages.

To test a production migration manually, use Actions → Supabase migrations → Run workflow and set `apply_migrations` to true. A manual run with that input applies the migrations if the secrets exist.

The workflow links to the supplied project reference and runs `supabase db push --linked --yes`. Review SQL migrations before enabling these secrets because subsequent matching pushes can apply new migrations to the linked database.
