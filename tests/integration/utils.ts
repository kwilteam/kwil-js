// Define the actions outside the functions for reuse
export const testActions = [
  {
    name: 'add_post',
    sql: `CREATE ACTION add_post($id uuid, $user text, $title text, $body text) PUBLIC { INSERT INTO posts (id, name, post_title, post_body) VALUES ($id, $user, $title, $body); }`,
  },
  {
    name: 'update_post',
    sql: `CREATE ACTION update_post($id uuid, $body text) PUBLIC { UPDATE posts SET post_body = $body WHERE id = $id; }`,
  },
  {
    name: 'delete_post',
    sql: `CREATE ACTION delete_post($id uuid) PUBLIC { DELETE FROM posts WHERE id = $id; }`,
  },
  {
    name: 'read_posts_count',
    sql: `CREATE ACTION read_posts_count() PUBLIC VIEW RETURNS (count int) { RETURN SELECT count(*) FROM posts; }`,
  },
  {
    name: 'get_post_by_id',
    sql: `CREATE ACTION get_post_by_id($id uuid) PUBLIC VIEW RETURNS (post_title text, post_body text) { RETURN SELECT post_title, post_body FROM posts WHERE id = $id; }`,
  },
  {
    name: 'view_with_param',
    sql: `CREATE ACTION view_with_param($title text) PUBLIC VIEW RETURNS TABLE (id uuid, name text, post_title text, post_body text) { RETURN SELECT * FROM posts WHERE post_title = $title; }`,
  },
  {
    name: 'get_post_by_title',
    sql: `CREATE ACTION get_post_by_title($title text) PUBLIC VIEW RETURNS (post_title text, post_body text) { for $row in SELECT post_title, post_body FROM posts WHERE post_title = $title { RETURN $row.post_title, $row.post_body; } ERROR(format('record with title = "%s" not found', $title)); }`,
  },
];

export async function createTestSchema(namespace: string, kwil: any, kwilSigner: any) {
  // Create namespace
  await kwil.execSql(`CREATE NAMESPACE ${namespace};`, {}, kwilSigner, true);

  // Create posts table
  const createTable = `{${namespace}} CREATE TABLE posts (id uuid PRIMARY KEY NOT NULL, name text NOT NULL, post_title text NOT NULL, post_body text NOT NULL);`;
  await kwil.execSql(createTable, {}, kwilSigner, true);

  // Create actions
  for (const action of testActions) {
    await kwil.execSql(`{${namespace}} ${action.sql}`, {}, kwilSigner, true);
  }
}

export async function dropTestSchema(namespace: string, kwil: any, kwilSigner: any) {
  // Drop actions first
  for (const action of testActions) {
    await kwil.execSql(`{${namespace}} DROP ACTION ${action.name};`, {}, kwilSigner, true);
  }

  // Drop table
  await kwil.execSql(`{${namespace}} DROP TABLE posts;`, {}, kwilSigner, true);

  // Drop namespace
  await kwil.execSql(`DROP NAMESPACE ${namespace};`, {}, kwilSigner, true);
}
