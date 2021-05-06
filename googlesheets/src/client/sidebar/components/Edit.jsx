import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import AddIcon from '@material-ui/icons/Add';
import CancelIcon from '@material-ui/icons/Cancel';
import FormLabel from '@material-ui/core/FormLabel';
import DeleteIcon from '@material-ui/icons/Delete';
import Divider from '@material-ui/core/Divider';
import GitHubIcon from '@material-ui/icons/GitHub';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText'; 
import SaveIcon from '@material-ui/icons/Save';
import Table from '@material-ui/core/Table';

import OAuth2 from './OAuth2';

const useStyles = makeStyles((theme) => ({
  root: {
    '& > *': {
      marginTop: theme.spacing(1),
      marginBottom: theme.spacing(1),
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },    
  },
  button: {
    margin: theme.spacing(1),
  },
  addHeaderButton: {
    margin: theme.spacing(0),
  },
}));

export default function Edit(props) {
  const classes = useStyles();
  
  const handleNameChange = (event) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.name = event.target.value;
    props.setSelectedCommand(selectedCommand);
  }

  const handleTypeChange = (event) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.command.type = event.target.value;
    props.setSelectedCommand(selectedCommand);
  }

  const handleFilterTypeChange = (event) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.filter.type = event.target.value;
    props.setSelectedCommand(selectedCommand);
  }

  const handleExpressionChange = (event) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.filter.filter.expression = event.target.value;
    props.setSelectedCommand(selectedCommand);
  }

  const submitEdit = () => {
    props.setEditing(false);
    props.saveCommands(props.commands);
  }

  return (
    <>
      <h4>Edit command</h4>
      <form className={classes.root} noValidate autoComplete="off">
        <TextField label="Command name" defaultValue={props.selectedCommand.name} onChange={handleNameChange} fullWidth 
        inputProps={{style: {fontSize: 14}}} InputLabelProps={{style: {fontSize: 14}}} required error={props.selectedCommand.name===''} />
        <TextField
          select
          label="Type"
          value={props.selectedCommand.command.type}
          size='small'
          fullWidth
          inputProps={{style: {fontSize: 12}}} InputLabelProps={{style: {fontSize: 12}}}
          required error={props.selectedCommand.command.type===''}
          onChange={handleTypeChange}
        >
          <MenuItem key='direct' value='direct'>
            API
          </MenuItem>
          {/*
          <MenuItem key='curl' value='curl' disabled>
            cURL (coming soon!)
          </MenuItem>
          <MenuItem key='database' value='database' disabled>
            Database (coming soon!)
          </MenuItem>
          <MenuItem key='web' value='web' disabled>
            Web (coming soon!)
          </MenuItem>
          */}
        </TextField>
        {
          props.selectedCommand.command.type == 'direct' ? <Direct {...props} saveNewHeader={props.saveNewHeader} newHeader={props.newHeader} setNewHeader={props.setNewHeader} />
          : props.selectedCommand.command.type == 'web' ? <Web {...props} saveNewHeader={props.saveNewHeader} newHeader={props.newHeader} setNewHeader={props.setNewHeader}/>
          : 'unrecognized command type: ' + props.selectedCommand.command.type 
        }
        <Divider variant="middle" light={true} /> {/* TODO: make this thinner */}
        <h4>Edit filter</h4>
        <TextField
          select
          label="Filter type"
          defaultValue={props.selectedCommand.filter.type}
          size='small'
          fullWidth
          inputProps={{style: {fontSize: 12}}} InputLabelProps={{style: {fontSize: 12}}}
          onChange={handleFilterTypeChange}
        >
          <MenuItem key='jmespath' value='jmespath'>
            JMESPath
          </MenuItem>
          <MenuItem key='jq' value='jq' disabled>
            jq (coming soon!)
          </MenuItem>
          <MenuItem key='jsonpath' value='jsonpath' disabled>
            JSONPath (coming soon!)
          </MenuItem>
          <MenuItem key='pup' value='pup' disabled>
            pup (coming soon!)
          </MenuItem>
          <MenuItem key='xpath' value='xpath' disabled>
            XPath (coming soon!)
          </MenuItem>
        </TextField>
        <TextField
          label="Expression"
          multiline
          rows={4}
          defaultValue={props.selectedCommand.filter.filter.expression}
          variant="outlined"
          fullWidth
          onChange={handleExpressionChange}
        />

        <Button
          size="small"
          className={classes.button}
          startIcon={<CancelIcon color='secondary' />}
          disabled={props.saving}
          onClick={(e) => props.setEditing(false)}
          style={{marginLeft:'0px'}}
        >
          Cancel
        </Button>
        <Button
          size="small"
          className={classes.button}
          startIcon={<SaveIcon color='primary' />}
          disabled={props.saving}
          style={{marginLeft:'0px'}}
          onClick={submitEdit}
        >
          Save
        </Button>
      </form>
    </>
  );
};

// Edit a direct command
function Direct(props) {
  const handleMethodChange = (event) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.command.command.method = event.target.value;
    props.setSelectedCommand(selectedCommand);
  }

  const handleBodyChange = (event) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.command.command.body = event.target.value;
    props.setSelectedCommand(selectedCommand);
  }

  return (
    <>
      <OAuth2 {...props} />
      <TextField
        select
        label="Method"
        defaultValue={props.selectedCommand.command.command.method}
        onChange={handleMethodChange}
        size='small'
        fullWidth
        inputProps={{style: {fontSize: 12}}} InputLabelProps={{style: {fontSize: 12}}}
        required error={props.selectedCommand.command.command.method===''}
      >
        <MenuItem key='get' value='get'>
          GET
        </MenuItem>
        <MenuItem key='post' value='post'>
          POST
        </MenuItem>
        <MenuItem key='put' value='put'>
          PUT
        </MenuItem>
      </TextField>
      <URL {...props} />
      <Headers {...props} /> 
      <TextField
        label="Body"
        multiline
        rows={4}
        defaultValue={props.selectedCommand.command.command.body}
        variant="outlined"
        fullWidth
        onChange={handleBodyChange}
      />
    </>
  )
}

// Edit a web command
function Web(props) {
  return (
    <>
      <URL {...props} />
      <Headers {...props} /> 
    </>
  )
}

function URL(props){
  const handleURLChange = (event) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.command.command.url = event.target.value;
    props.setSelectedCommand(selectedCommand);
  }

  return (
    <>
      <TextField label="URL" defaultValue={props.selectedCommand.command.command.url} onChange={handleURLChange} fullWidth inputProps={{style: {fontSize: 12}}} InputLabelProps={{style: {fontSize: 12}}} required error={props.selectedCommand.command.command.url===''} />
    </>
  )
}

function Headers(props){
  const handleNewHeaderKey = (idx, key) => {
    props.setNewHeader({...props.newHeader, 'key': key});
  }

  const handleNewHeaderValue = (idx, value) => {
    props.setNewHeader({...props.newHeader, 'value': value});
  }

  const deleteHeader = (idx) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.command.command.headers.splice(idx, 1);
    props.setSelectedCommand(selectedCommand);
  }

  const handleChangeHeaderKey = (idx, key) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.command.command.headers[idx].key = key;
    props.setSelectedCommand(selectedCommand);
  }
  const handleChangeHeaderValue = (idx, val) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.command.command.headers[idx].value = val;
    props.setSelectedCommand(selectedCommand);
  }

  return(
    <>
      <FormLabel style={{fontSize:'12px'}}>Headers</FormLabel>
      <List dense={true}>
        {props.selectedCommand.command.command.headers && props.selectedCommand.command.command.headers.length > 0 && props.selectedCommand.command.command.headers.map((header, idx) => (
          <HeaderListItem new={false} key={idx} index={idx} headerKey={header.key} headerValue={header.value} handleChangeHeaderKey={handleChangeHeaderKey} handleChangeHeaderValue={handleChangeHeaderValue} deleteHeader={deleteHeader} />
        ))}
        <HeaderListItem new={true} key={props.newHeader.key ? props.newHeader.key : ''} index={-1} headerKey={props.newHeader.key ? props.newHeader.key : ''} headerValue={props.newHeader.value ? props.newHeader.value : ''} handleChangeHeaderKey={handleNewHeaderKey} handleChangeHeaderValue={handleNewHeaderValue} saveNewHeader={props.saveNewHeader} />
      </List>
    </>
  )
}

function HeaderListItem(props){
  const classes = useStyles();

  return (
    <>
    <ListItem style={{paddingLeft:'0px',paddingRight:'0px'}}>
      <TextField label="Key" defaultValue={props.headerKey} onPaste={(e) => props.handleChangeHeaderKey(props.index, e.target.value)} onChange={(e) => props.handleChangeHeaderKey(props.index, e.target.value)} inputProps={{style: {fontSize: 12}}} InputLabelProps={{style: {fontSize: 12}}} />
      <TextField label="Value" defaultValue={props.headerValue} onPaste={(e) => props.handleChangeHeaderValue(props.index, e.target.value)} onChange={(e) => props.handleChangeHeaderValue(props.index, e.target.value)} inputProps={{style: {fontSize: 12}}} InputLabelProps={{style: {fontSize: 12}}} style={{paddingLeft: '5px'}}/>
      <ListItemIcon style={{minWidth:'24px'}}>
        {
          !props.new && <DeleteIcon fontSize={'small'} onClick={(e) => props.deleteHeader(props.index)} /> 
        }
      </ListItemIcon>
    </ListItem>
    {
      props.new && (
        <ListItem style={{paddingLeft:'0px',paddingRight:'0px'}}>
          <ListItemText>
            <Button
              size="small"
              variant='text'
              className={classes.addHeaderButton}
              startIcon={<AddIcon color='primary' />}
              onClick={props.saveNewHeader}
            >
              New header
            </Button>
          </ListItemText>
        </ListItem>
      )
    }
    </>
  )
}
