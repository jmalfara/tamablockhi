import * as React from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import LinearProgress from '@mui/material/LinearProgress';
import petIdle from '../assets/pet_idle.gif'
import petEating from '../assets/pet_eating.gif'
import petPoopOne from '../assets/pet_poop_one.gif'
import petPoopTwo from '../assets/pet_poop_two.gif'
import petPoopThree from '../assets/pet_poop_three.gif'
import petPoopFour from '../assets/pet_poop_four.gif'

const TamablockhiView = ({
    id,
    tamablockhiState,
    currentBlock,
    handleFeed,
    handleClean,
    handleWater
}) => {
    const starvationPercent = ((tamablockhiState.starvationBlock - currentBlock) / 19185 * 100).toFixed(2);
    const dehydratedPercent = ((tamablockhiState.dehydrationBlock - currentBlock) / 19185 * 100).toFixed(2);
    const numberOfPoops = calculateNumberOfPoops(tamablockhiState.poopScheduledForBlocks, currentBlock)
    const cleanPercent = calculatePercentUntilInfection(tamablockhiState.poopScheduledForBlocks[0], currentBlock) * 100
    const nextPoop = calculateNextPoopInBlocks(tamablockhiState.poopScheduledForBlocks, currentBlock)

    const feedDisabled = tamablockhiState.feedState !== "enabled" && tamablockhiState.feedState
    const waterDisabled = tamablockhiState.waterState !== "enabled" && tamablockhiState.waterState
    const cleanDisabled = (tamablockhiState.cleanState !== "enabled" && tamablockhiState.cleanState) || numberOfPoops === 0

    var asset = ""
    if (feedDisabled || waterDisabled) {
        asset = petEating
    } else {
        asset = petIdle
    }

    var poopAsset = ""
    if (numberOfPoops === 0) {
        poopAsset = ""
    } else if (numberOfPoops === 1) {
        poopAsset = petPoopOne
    } else if (numberOfPoops === 2) {
        poopAsset = petPoopTwo
    } else if (numberOfPoops === 3) {
        poopAsset = petPoopThree
    } else if (numberOfPoops === 4) {
        poopAsset = petPoopFour
    }

    return (
        <Paper style={{ margin: 8, padding: 8, width: "max-content" }}>
            <div style={{ display: "grid" }}>
                <img src={poopAsset} alt="" style={{ 
                    display: "block", 
                    marginLeft: "auto", 
                    marginRight: "auto",
                    gridColumn: 1,
                    gridRow: 1
                }}/>

                <img src={asset} alt="" style={{ 
                    display: "block", 
                    marginLeft: "auto", 
                    marginRight: "auto",
                    gridColumn: 1,
                    gridRow: 1
                }}/>
            </div>
            <div>Thirst: %{dehydratedPercent}</div>
            <LinearProgress variant="determinate" value={dehydratedPercent} />
            <div>Hunger: %{starvationPercent}</div>
            <LinearProgress variant="determinate" value={starvationPercent} />
            <div>Poops:  {numberOfPoops}</div>
            {
                cleanPercent < 100 && <LinearProgress variant="determinate" value={cleanPercent} />
            }
            <Button style={{ margin: 8 }} variant="contained"
                onClick={() => handleFeed(id)} disabled={feedDisabled}>Feed</Button>
            <Button style={{ margin: 8 }} variant="contained"
                onClick={() => handleWater(id)} disabled={waterDisabled}>Water</Button>
            <Button style={{ margin: 8 }} variant="contained"
                onClick={() => handleClean(id)} disabled={cleanDisabled}>Clean in {nextPoop}</Button>
        </Paper>
    )
}

const calculateNumberOfPoops = (poopScheduledForBlocks, currentBlock) => {
    return poopScheduledForBlocks.filter(item => item <= currentBlock).length
}

const calculateNextPoopInBlocks = (poopScheduledForBlocks, currentBlock) => {
    return poopScheduledForBlocks.filter(item => item > currentBlock)[0] - currentBlock
}

const calculatePercentUntilInfection = (lastPoopedAt, currentBlock) => {
    if (lastPoopedAt === undefined || lastPoopedAt === null) {
        return 1;
    }

    const maxBlocksUntilInfected = 19185
    const deadAtBlock = lastPoopedAt + maxBlocksUntilInfected
    const blocksUntilDead = deadAtBlock - currentBlock
    const percentageClean = blocksUntilDead / maxBlocksUntilInfected
    if (percentageClean > 1) {
        return 1
    }
    return percentageClean
}

export default TamablockhiView