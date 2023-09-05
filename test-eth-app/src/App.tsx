import './App.css'
import { deployDb } from './tests/testDeploy';
// import { testV5Funding } from './tests/v5Funding'
import { testV5Transaction } from './tests/v5Signing';

declare global {
  interface Window {
    ethereum?: any;
  }
}

function App() {

  async function test() {
    // await testV5Funding()
    await testV5Transaction()
    // await deployDb()
  }

  return (
    <>
      <h1>Click Button to Test</h1>
      <div className="card">
        <button onClick={() => test()}>
          Click me!
        </button>
        <p>
          Edit <code>src/App.tsx</code> to change the function to test.
        </p>
      </div>
    </>
  )
}

export default App
