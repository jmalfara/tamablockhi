import * as React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';

const TokenFeed = ({
    tokens,
    handleHatch,
    hatching
}) => {
    return(
        <Paper style={{ marginTop: 8, padding: 8 }}>
            <Stack spacing={2} direction="row">
                <div>EGG:   {tokens?.egg}</div>
                <div>FOOD:  {tokens?.food}</div>
                <div>WATER: {tokens?.water}</div>
                <div>POOP:  {tokens?.poop}</div>
                <Button variant="contained"
                    onClick={handleHatch}
                    disabled={hatching}>
                    Hatch
                </Button>
            </Stack>
        </Paper>
    )
}

export default TokenFeed