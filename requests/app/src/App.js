import * as React from 'react';
import './App.css';
import Home from './page/Home';

function App() {
  React.useMemo(() => {
      console.log("Running App")
      // handleConnectClick()
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Home/>
  );
}

export default App;
