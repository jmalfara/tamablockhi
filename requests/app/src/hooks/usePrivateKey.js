import * as React from 'react';
import useLocalStorage from './useLocalStorage';
import { ethers } from 'ethers';

const usePrivateKey = () => {
    const [privateKey, setPrivateKey] = useLocalStorage("pk", null)

    React.useMemo(() => {
        if (privateKey !== null) {
            return
        }
        const wallet = ethers.Wallet.createRandom()
        const pk = wallet._signingKey().privateKey
        console.log("Expected Address: " + wallet.address)
        setPrivateKey(pk)
    }, [privateKey, setPrivateKey])

    return [privateKey];
  };

  export default usePrivateKey;