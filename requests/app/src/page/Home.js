import * as React from 'react';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import TokenFeed from '../components/TokenFeed';

import { ethers } from 'ethers';
import TamablockhiView from '../components/TamablockhiView';
import usePrivateKey from '../hooks/usePrivateKey';
import { Alert, Button, Stack, TextField } from '@mui/material';
import TransferView from '../components/TransferView';
// import ContentCopyIcon from '@mui/icons-material/ContentCopy';
const { abi, networks } = require('../Tamablockhi.json')

const rpcMoonbaseAlpha = 'https://rpc.api.moonbase.moonbeam.network'
const chainId = 1287
const networkName = "Moonbeam Alpha"
const explorerUrl = "https://moonbase.moonscan.io"
const provider = new ethers.providers.StaticJsonRpcProvider(
    rpcMoonbaseAlpha,
    {
        chainId: chainId,
        name: networkName,
    }
);
const contractAddress = networks[chainId].address

const Home = () => {
    const [pageState, setPageState] = React.useState(HomePageState)
    const [privateKey] = usePrivateKey()

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

    React.useEffect(() => {
        let wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(contractAddress, abi, wallet)
        console.log(wallet.address)

        console.log(contract)
        refreshData(contract)

        setPageState(prevState => ({
            ...prevState,
            contract: contract,
            connectedText: `Connected (${networkName})`
        }))
    }, [privateKey]);

    React.useEffect(() => {
        if (alert == null) {
            return
        }
        const interval = setInterval(() => {
            setPageState(prevState => ({
                ...prevState,
                alert: null
            }))
            clearInterval(interval)
        }, 3000);
        return () => clearInterval(interval);
    }, [pageState.alert]);

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
        }))
    }

    const handleFeed = async (tamoId) => {
        updateTamoActionStates(tamoId, "feedState", "loading")

        try {
            const walletAddress = pageState.contract.signer.address;
            const tx = await pageState.contract.feed(walletAddress, tamoId, 1);
            console.log(`Transaction Sent: ${tx.hash}`)
            const reciept = await tx.wait()
            console.log(reciept)
            refreshData(pageState.contract)
        } catch (e) {
            console.error("Reason Code: " + resolveRevertErrorCode(e))
        } finally {
            updateTamoActionStates(tamoId, "feedState", "enabled")
        }
    }

    const handleWater = async (tamoId) => {
        updateTamoActionStates(tamoId, "waterState", "loading")

        try {
            const walletAddress = pageState.contract.signer.address;
            const tx = await pageState.contract.water(walletAddress, tamoId, 1);
            console.log(`Transaction Sent: ${tx.hash}`)
            const reciept = await tx.wait()
            console.log(reciept)
            refreshData(pageState.contract)
        } catch (e) {
            console.error("Reason Code: " + resolveRevertErrorCode(e))
        } finally {
            updateTamoActionStates(tamoId, "waterState", "enabled")
        }
    }

    const handleClean = async (tamoId) => {
        updateTamoActionStates(tamoId, "cleanState", "loading")

        try {
            const walletAddress = pageState.contract.signer.address;
            const tx = await pageState.contract.clean(walletAddress, tamoId);
            console.log(`Transaction Sent: ${tx.hash}`)
            const reciept = await tx.wait()
            console.log(reciept)
            refreshData(pageState.contract)
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
            const walletAddress = pageState.contract.signer.address;
            const tx = await pageState.contract.hatch(walletAddress, []);
            console.log(`Transaction Sent: ${tx.hash}`)
            const reciept = await tx.wait()
            console.log(reciept)
            refreshData(pageState.contract)
        } catch (e) {
            console.error("Reason Code: " + resolveRevertErrorCode(e))
        } finally {
            setPageState(prevState => ({
                ...prevState,
                hatching: false
            }))
        }
    }

    const handleTransfer = async (data) => {
        console.log(data)
        setPageState(prevState => ({
            ...prevState,
            transfering: true
        }))

        const { tokenId, destinationAddress, amount } = data
        console.log(data)
        try {
            const walletAddress = pageState.contract.signer.address;
            const tx = await pageState.contract.safeTransferFrom(walletAddress, destinationAddress, tokenId, parseInt(amount), []);
            console.log(`Transaction Sent: ${tx.hash}`)
            const reciept = await tx.wait()
            console.log(reciept)
            refreshData(pageState.contract)
        } catch (e) {
            console.error(e)
            console.error("Reason Code: " + resolveRevertErrorCode(e))
        } finally {
            setPageState(prevState => ({
                ...prevState,
                transfering: false
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

    const resolveRevertErrorCode = (e) => {
        var message
        try {
            message = e.message.match(/\\"VM Exception while processing transaction: revert ([0-9]*)\\"/)[1]
        } catch {
            message = "An unhandled error has occured"
        }
        setPageState(prevState => ({
            ...prevState,
            alert: message
        }))
        return message
    }

    return (
        <div>
            <Stack direction="row" spacing={2} style={{ justifyContent: "space-between", backgroundColor: "gray" }}>
                <Paper style={{ margin: 8, padding: 8 }}>
                    <div>{pageState.currentBlock}</div>
                </Paper>

                <div style={{ margin: 8 }}>
                    <Button style={{ margin: 8 }} variant="contained"
                        onClick={() => {
                            window.open(`${explorerUrl}/address/${pageState.contract.signer.address}`)
                        }}>{pageState.connectedText}</Button>

                    <Button variant="contained"
                        onClick={() => {
                            window.open(`https://apps.moonbeam.network/moonbase-alpha/faucet/`)
                        }}>Test Faucet</Button>
                </div>
            </Stack>

            {
                pageState.alert ? <Alert severity="error">{pageState.alert}</Alert> : null
            }

            <div className="App-header">
                <TokenFeed
                    tokens={pageState.balances}
                    handleHatch={handleHatch}
                    hatching={pageState.hatching} />

                <div style={{ margin: 8, padding: 8 }}>
                    <TransferView submitTransfer={handleTransfer} transfering={pageState.transfering}/>
                </div>

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
        </div>
    );
}

const HomePageState = {
    currentBlock: 0,
    contractAddress: null,
    connectedText: "Connecting",
    alert: null,
    balances: {
        egg: 0,
        food: 0,
        water: 0,
        poop: 0
    },
    tamablockhis: {}
}

export default Home;