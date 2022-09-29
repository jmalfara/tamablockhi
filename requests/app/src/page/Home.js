import * as React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';

import { ethers } from 'ethers';
const { abi, networks } = require('../Tamablockhi.json')

const rpcMoonbaseAlpha = 'https://rpc.api.moonbase.moonbeam.network'
const provider = new ethers.providers.StaticJsonRpcProvider(
    rpcMoonbaseAlpha,
    {
        chainId: 1287,
        name: "Moonbeam Alpha",
    }
);

const Home = () => {
    const [privateKey, setPrivateKey] = React.useState("")
    const [contract, setContract] = React.useState(null)
    const [pageState, setPageState] = React.useState(HomePageState)

    React.useEffect(() => {
        provider.on("block", async (blockNumber) => {
            console.log("Block: " + blockNumber)
            setPageState( prevState => ({
                ...prevState,
                currentBlock: blockNumber
            }))
        });
        return () => provider.removeAllListeners();
      }, []);

    const handleConnectClick = async () => {
        // Initialize the contract
        let wallet = new ethers.Wallet(privateKey, provider);
        console.log(wallet.address)
        const contractAddress = networks[1287].address;
        const contract = new ethers.Contract(contractAddress, abi, wallet)

        setContract(contract)
        refreshData(contract)
    }

    const refreshData = async (contract) => {
        const walletAddress = contract.signer.address;
        const foodTokens = await contract.balanceOf(walletAddress, 0);
        const poopTokens = await contract.balanceOf(walletAddress, 1);
        const waterTokens = await contract.balanceOf(walletAddress, 2);
        const loveTokens = await contract.balanceOf(walletAddress, 3);
        const eggTokens = await contract.balanceOf(walletAddress, 4);

        const balances = {
            food: foodTokens.toNumber(),
            poop: poopTokens.toNumber(),
            water: waterTokens.toNumber(),
            love: loveTokens.toNumber(),
            egg: eggTokens.toNumber()
        }

        const starvationBlock = await contract.starvationBlockOf(pageState.selectedTamablockhi);
        const dehydrationBlock = await contract.dehydrationBlockOf(pageState.selectedTamablockhi);
        const poopScheduledForBlockss = await contract.poopScheduledForBlocks(pageState.selectedTamablockhi)

        setPageState( prevState => ({
                ...prevState,
                balances: balances,
                Tamablockhis: {
                    [pageState.selectedTamablockhi]: {
                        ...prevState.Tamablockhis[pageState.selectedTamablockhi],
                        starvationBlock: starvationBlock.toNumber(),
                        dehydrationBlock: dehydrationBlock.toNumber(),
                        poopScheduledForBlockss: poopScheduledForBlockss.map(
                            block => block.toNumber()
                        )
                    }
                }
            })
        )
    }

    const handleFeed = async (tamoId) => {
        updateTamoActionStates(tamoId, "feedState", "loading")

        try {
            const walletAddress = contract.signer.address;
            const tx = await contract.feed(walletAddress, tamoId, 1);
            console.log(`Transaction Sent: ${tx.hash}`)
            const reciept = await tx.wait()
            console.log(reciept)
            refreshData(contract)
        } catch (e) {
            console.error(e)
        } finally {
            updateTamoActionStates(tamoId, "feedState", "enabled")
        }
    }

    const handleWater = async (tamoId) => {
        updateTamoActionStates(tamoId, "waterState", "loading")

        try {
            const walletAddress = contract.signer.address;
            const tx = await contract.water(walletAddress, tamoId, 1);
            console.log(`Transaction Sent: ${tx.hash}`)
            const reciept = await tx.wait()
            console.log(reciept)
            refreshData(contract)
        } catch (e) {
            console.error(e)
        } finally {
            updateTamoActionStates(tamoId, "waterState", "enabled")
        }
    }

    const handleClean = async (tamoId) => {
        updateTamoActionStates(tamoId, "cleanState", "loading")

        try {
            const walletAddress = contract.signer.address;
            const tx = await contract.clean(walletAddress, tamoId);
            console.log(`Transaction Sent: ${tx.hash}`)
            const reciept = await tx.wait()
            console.log(reciept)
            refreshData(contract)
        } catch (e) {
            console.error(e)
        } finally {
            updateTamoActionStates(tamoId, "cleanState", "enabled")
        }
    }

    const updateTamoActionStates = (tamoId, actionState, value) => {
        setPageState(prevState => ({
            ...pageState,
            Tamablockhis: {
                [tamoId]: {
                    ...prevState.Tamablockhis[tamoId],
                    [actionState]: value
                }
            }
        }))
    }

    return (
        <div className="App">
            <header className="App-header">
                <Paper style={{ marginTop: 8 }}>
                    <div>Block Number:  {pageState.currentBlock}</div>
                </Paper>

                <Stack style={{ marginTop: 8 }} direction="row" spacing={2}>
                    <Paper style={{ padding: 8 }}>
                        <TextField
                            id="textfield-pk"
                            label="Private Key (TO BE REMOVED)"
                            type="password"
                            value={privateKey}
                            onChange={(e) => setPrivateKey(e.target.value)} />
                    </Paper>
                    <Button variant="contained" onClick={handleConnectClick} >Connect</Button>
                </Stack>

                <Paper style={{ marginTop: 8 }}>
                    <Stack style={{ padding: 8 }} spacing={2} direction="row">
                        <div>EGG:   {pageState.balances?.egg}</div>
                        <div>FOOD:  {pageState.balances?.food}</div>
                        <div>WATER: {pageState.balances?.water}</div>
                        <div>POOP:  {pageState.balances?.poop}</div>
                    </Stack>
                </Paper>

                {
                    Object.keys(pageState.Tamablockhis).map(key => {
                        const item = pageState.Tamablockhis[key]
                        const feedDisabled = item.feedState != "enabled"
                        const waterDisabled = item.waterState != "enabled"
                        const cleanDisabled = item.cleanState != "enabled"

                        return (
                            <Paper style={{ marginTop: 8 }} key={key}>
                                <div>Tamablockhi ID:  <b>{key}</b></div>
                                <div>Blocks until dehydrated:  <b>{item.dehydrationBlock - pageState.currentBlock}</b></div>
                                <div>Blocks until starved:  <b>{item.starvationBlock - pageState.currentBlock}</b></div>
                                <div>Blocks until next poop:  <b>{item.poopScheduledForBlockss[0] - pageState.currentBlock}</b></div>
                                <Button style={{ margin: 8 }} variant="contained" 
                                    onClick={() => handleFeed(key)} disabled={feedDisabled}>Feed</Button>
                                <Button style={{ margin: 8 }} variant="contained" 
                                    onClick={() => handleWater(key)} disabled={waterDisabled}>Water</Button>
                                <Button style={{ margin: 8 }} variant="contained" 
                                    onClick={() => handleClean(key)} disabled={cleanDisabled}>Clean</Button>
                            </Paper>
                        )
                    })
                }
            </header>
        </div>
    );
}


const HomePageState = {
    balances: {
        egg: 0,
        food: 0,
        water: 0,
        poop: 0
    },
    currentBlock: 0,
    selectedTamablockhi: 11,
    Tamablockhis: {
        11: {
            starvationBlock: 0,
            dehydrationBlock: 0,
            poopScheduledForBlockss: [0],
            feedState: "enabled",
            waterState: "enabled",
            cleanState: "enabled"
        }
    }
}

export default Home;