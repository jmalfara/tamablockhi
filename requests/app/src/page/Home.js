import * as React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TokenFeed from '../components/TokenFeed';

import { ethers } from 'ethers';
import TamablockhiView from '../components/TamablockhiView';
const { abi, networks } = require('../Tamablockhi.json')

const rpcMoonbaseAlpha = 'https://rpc.api.moonbase.moonbeam.network'
const chainId = 1287
const provider = new ethers.providers.StaticJsonRpcProvider(
    rpcMoonbaseAlpha,
    {
        chainId: chainId,
        name: "Moonbeam Alpha",
    }
);
const contractAddress = networks[chainId].address

const Home = () => {
    const [privateKey, setPrivateKey] = React.useState("")
    const [contract, setContract] = React.useState(null)
    const [pageState, setPageState] = React.useState(HomePageState)

    React.useEffect(() => {
        provider.on("block", async (blockNumber) => {
            console.log("Block: " + blockNumber)
            setPageState(prevState => ({
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

        const tamablockhiIds = await contract.getTamablockhiIds(walletAddress)

        const tamablockhisLite = {}
        await Promise.all(tamablockhiIds.map(async (idBigNumber) => {
            const id = idBigNumber.toNumber()
            try {
                const state = await contract.getTamablockhiState(id, true);
                tamablockhisLite[id] = {
                    starvationBlock: state.starvationBlock.toNumber(),
                    dehydrationBlock: state.dehydrationBlock.toNumber(),
                    poopScheduledForBlocks: state.poopQueue.map(bigNumber => {
                        return bigNumber.toNumber()
                    })
                }
            } catch (e) {
                console.error(e)
            }
        }))

        setPageState(prevState => ({
            ...prevState,
            balances: balances,
            tamablockhis: {
                ...prevState.tamablockhis,
                ...tamablockhisLite
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
            console.error("Reason Code: " + resolveRevertErrorCode(e))
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
            console.error("Reason Code: " + resolveRevertErrorCode(e))
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
            console.error("Reason Code: " + resolveRevertErrorCode(e))
        } finally {
            updateTamoActionStates(tamoId, "cleanState", "enabled")
        }
    }

    const handleHatch = async () => {
        setPageState(prevState => ({
            ...prevState,
            hatching: true
        }))

        try {
            const walletAddress = contract.signer.address;
            const tx = await contract.hatch(walletAddress, []);
            console.log(`Transaction Sent: ${tx.hash}`)
            const reciept = await tx.wait()
            console.log(reciept)
            refreshData(contract)
        } catch (e) {
            console.error("Reason Code: " + resolveRevertErrorCode(e))
        } finally {
            setPageState(prevState => ({
                ...prevState,
                hatching: false
            }))
        }
    }

    const updateTamoActionStates = (tamoId, actionState, value) => {
        setPageState(prevState => ({
            ...prevState,
            tamablockhis: {
                ...prevState.tamablockhis,
                [tamoId]: {
                    ...prevState.tamablockhis[tamoId],
                    [actionState]: value
                }
            }
        }))
    }

    return (
        <div className="App-header">
            <Paper style={{ marginTop: 8, padding: 8 }}>
                <div>Block Number:  {pageState.currentBlock}</div>
            </Paper>

            <Stack style={{ marginTop: 8, padding: 8 }} direction="row" spacing={2}>
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

            <TokenFeed
                tokens={pageState.balances}
                handleHatch={handleHatch}
                hatching={pageState.hatching} />

            <Grid
                container
                justifyContent="center"
                alignItems="center">
                {
                    Object.keys(pageState.tamablockhis).map(key => {
                        const state = pageState.tamablockhis[key]
                        return (
                            <TamablockhiView
                                id={key}
                                tamablockhiState={state}
                                currentBlock={pageState.currentBlock}
                                handleClean={handleClean}
                                handleFeed={handleFeed}
                                handleWater={handleWater}
                            />
                        )
                    })
                }
            </Grid>
        </div>
    );
}

const resolveRevertErrorCode = (e) => {
    return e.message.match(/\\"VM Exception while processing transaction: revert ([0-9]*)\\"/)[1]
}

const HomePageState = {
    currentBlock: 0,
    balances: {
        egg: 0,
        food: 0,
        water: 0,
        poop: 0
    },
    tamablockhis: {}
}

export default Home;