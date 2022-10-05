import * as React from 'react';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import { FormControl, FormHelperText, InputLabel, MenuItem, Select, TextField } from '@mui/material';

const TransferView = ({
    transfering,
    submitTransfer
}) => {
    const [state, setState] = React.useState({})

    const handleTokenSelected = (e) => {
        console.log(e)
        setState(oldState => ({
            ...oldState,
            tokenId: e.target.value
        }))
    }

    const handleDestinationAddress = (e) => {
        console.log(e)
        setState(oldState => ({
            ...oldState,
            destinationAddress: e.target.value
        }))
    }

    const handleAmount = (e) => {
        console.log(e)
        const input = e.target.value
        if( !input || ( input[input.length-1].match('[0-9]') && input[0].match('[1-9]')) ) {
            setState(oldState => ({
                ...oldState,
                amount: e.target.value
            }))
        }
    }

    const handleSubmit = () => {
        var errorToken
        if (!state.tokenId == undefined || state.tokenId == null) {
            errorToken = "Required *"
        }

        var errorDestination
        if (!state.destinationAddress) {
            errorDestination = "Required *"
        }

        var errorAmount
        if (!state.amount) {
            errorAmount = "Required *"
        }

        setState(oldState => ({
            ...oldState,
            tokenValidation: errorToken,
            destinationValidation: errorDestination,
            amountValidation: errorAmount
        }))

        submitTransfer({
            tokenId: state.tokenId,
            destinationAddress: state.destinationAddress,
            amount: state.amount
        })
    }

    return (
        <Paper style={{ padding: 8 }}>
            <Stack style={{ marginTop: 8, padding: 8 }} direction="row" spacing={2}>
                <FormControl style={{minWidth: 120}} error={!!state.tokenValidation}>
                    <InputLabel id="demo-simple-select-label">Age</InputLabel>
                    <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={state.tokenId === undefined ? '' : state.tokenId}
                        label="Age"
                        onChange={(e) => handleTokenSelected(e)}
                    >
                        <MenuItem value={4}>EGG</MenuItem>
                        <MenuItem value={0}>FOOD</MenuItem>
                        <MenuItem value={2}>WATER</MenuItem>
                        <MenuItem value={1}>POOP</MenuItem>
                    </Select>
                    <FormHelperText>{state.tokenValidation}</FormHelperText>
                </FormControl>

                <TextField
                    error={!!state.destinationValidation}
                    id="textfield-destination"
                    label="Destination Address"
                    value={state.destinationAddress || ''}
                    helperText={state.destinationValidation}
                    onChange={(e) => handleDestinationAddress(e)} />

                <TextField
                    error={!!state.amountValidation}
                    id="textfield-amount"
                    label="Amount"
                    type="number"
                    value={state.amount  || ''}
                    InputProps={{
                        inputProps: { min: 0 }
                    }}
                    helperText={state.amountValidation}
                    onChange={(e) => handleAmount(e)} />

                <Button variant="contained" onClick={handleSubmit} disabled={transfering}>Send</Button>
            </Stack>
        </Paper>

    )
}

export default TransferView