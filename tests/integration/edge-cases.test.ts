// TODO: Requires updating to new syntax in order to work
describe.skip('Testing case sensitivity on test_db', () => {
  it('placeholder test until tests are updated', () => {
    expect(true).toBe(true);
  });
  //   let dbid: string;
  //   beforeAll(async () => {
  //     const res = await kwil.listDatabases(kwilSigner.identifier);
  //     const dbList = res.data;
  //     if (!dbList) {
  //       await deployTempSchema(schema, kwilSigner);
  //       return;
  //     }
  //     for (const db of dbList) {
  //       if (db.name.startsWith('test_db_')) {
  //         dbid = db.dbid;
  //         return;
  //       }
  //     }
  //     await deployTempSchema(schema, kwilSigner);
  //     dbid = kwil.getDBID(kwilSigner.identifier, `test_db_${dbList.length + 1}`);
  //   }, 10000);
  //   afterAll(async () => {
  //     const body: DropBody = {
  //       dbid,
  //     };
  //     await kwil.drop(body, kwilSigner, true);
  //   }, 10000);
  //   async function buildActionInput(): Promise<ActionInput> {
  //     return {
  //       $username: 'Luke',
  //       $age: 25,
  //     };
  //   }
  //   it('should execute createUserTest action', async () => {
  //     const actionInputs = await buildActionInput();
  //     const body: ActionBody = {
  //       name: 'createUserTest',
  //       dbid,
  //       inputs: [actionInputs],
  //     };
  //     const result = await kwil.execute(body, kwilSigner, true);
  //     expect(result.data).toBeDefined();
  //     expect(result.data).toMatchObject<TxReceipt>({
  //       tx_hash: expect.any(String),
  //     });
  //   }, 10000);
  //   it('should execute delete_user action', async () => {
  //     const body: ActionBody = {
  //       name: 'delete_user',
  //       dbid,
  //     };
  //     const result = await kwil.execute(body, kwilSigner, true);
  //     expect(result.data).toBeDefined();
  //     expect(result.data).toMatchObject<TxReceipt>({
  //       tx_hash: expect.any(String),
  //     });
  //   }, 10000);
  //   it('should execute CREATEUSERTEST action', async () => {
  //     const actionInputs = await buildActionInput();
  //     const body: ActionBody = {
  //       name: 'CREATEUSERTEST',
  //       dbid,
  //       inputs: [actionInputs],
  //     };
  //     const result = await kwil.execute(body, kwilSigner, true);
  //     expect(result.data).toBeDefined();
  //     expect(result.data).toMatchObject<TxReceipt>({
  //       tx_hash: expect.any(String),
  //     });
  //   }, 10000);
  //   it('should execute DELETE_USER action', async () => {
  //     const body: ActionBody = {
  //       name: 'DELETE_USER',
  //       dbid,
  //     };
  //     const result = await kwil.execute(body, kwilSigner, true);
  //     expect(result.data).toBeDefined();
  //     expect(result.data).toMatchObject<TxReceipt>({
  //       tx_hash: expect.any(String),
  //     });
  //   }, 10000);
  //   it('should execute createusertest action', async () => {
  //     const actionInputs = await buildActionInput();
  //     const body: ActionBody = {
  //       name: 'createusertest',
  //       dbid,
  //       inputs: [actionInputs],
  //     };
  //     const result = await kwil.execute(body, kwilSigner, true);
  //     expect(result.data).toBeDefined();
  //     expect(result.data).toMatchObject<TxReceipt>({
  //       tx_hash: expect.any(String),
  //     });
  //   }, 10000);
});
