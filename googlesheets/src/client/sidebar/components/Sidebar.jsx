import React, { useState, useEffect } from 'react';
import server from '../../utils/server';
const { serverFunctions } = server;
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';
import DirectionsRun from '@material-ui/icons/DirectionsRun';
import EditIcon from '@material-ui/icons/Edit';
import Divider from '@material-ui/core/Divider';
import Snackbar from '@material-ui/core/Snackbar';
import MuiAlert from '@material-ui/lab/Alert';
import CircularProgress from '@material-ui/core/CircularProgress';
import BookIcon from '@material-ui/icons/Book';
import GitHubIcon from '@material-ui/icons/GitHub';
import Typography from '@material-ui/core/Typography';

import Edit from './Edit';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > *': {
      margin: theme.spacing(1),
    },
  },
  button: {
    margin: theme.spacing(1),
    marginLeft: theme.spacing(0),
  },
  divider: {
    marginBottom: theme.spacing(1),
  }
}));

function Alert(props) {
  return <MuiAlert elevation={6} variant="filled" {...props} />;
}

export default function Sidebar(props) {
  const classes = useStyles();
  const [commands, setCommands] = useState([]);
  const [getting, setGetting] = useState(false);
  const [running, setRunning] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedCommand, setSelectedCommand] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(-2);
  const [saving, setSaving] = useState(false);

  // snackbar alert
  const [alertOpen, setAlertOpen] = React.useState(false);
  const [alertMessage, setAlertMessage] = React.useState('');
  const handleAlertClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlertOpen(false);
  };

  useEffect(() => {
    // get the user's commands
    setGetting(true);
    serverFunctions.getCommands().then(function(rsp){
      if('error' in rsp){
        setAlertMessage(rsp.error);
        setAlertOpen(true);
      } else if ('response' in rsp) {
        setCommands(rsp.response);
      }
      setGetting(false);
    }).catch(function(err){
      setAlertMessage('Unable to get your saved commands. Please try again.');
      setAlertOpen(true);
      setGetting(false);
    });    
  }, []);

  useEffect(() => {
    if (!commands){
      setCommands([]);
    }
  }, [commands]);

  function editCommand(idx, command){
    setEditing(true);
    setSelectedIndex(idx);
    setSelectedCommand({...command});
  }

  function runCommand(name) {
    setRunning(true);
    serverFunctions.runCommand(name).then(setRunning(false)).catch(function(err){
      setRunning(false);
      setAlertMessage('Unable to run your command. Please try again.');
    });
  }

  // keep this outside the Edit page so that we add their new header row automatically on save if they forget to press "+"
  const [newHeader, setNewHeader] = useState({key: '', value: ''});
  useEffect(() => {
    saveNewHeader();
  }, [newHeader]);
  const saveNewHeader = () => {
    // make sure the header isn't empty and has key and value set
    if (newHeader && Object.keys(newHeader).length === 0 && newHeader.constructor === Object){
      return
    }
    for (var key in newHeader){
      if (newHeader[key] === null || newHeader[key] === ''){
        return;
      }
    }

    var sc = JSON.parse(JSON.stringify(selectedCommand));
    if (!sc.command.command.headers){
      sc.command.command.headers = [];
    }
    sc.command.command.headers.push(newHeader);
    setSelectedCommand(sc);
    setNewHeader({key: '', value: ''});
  }

  const saveCommands = (cmds) => {
    setSaving(true);
    setAlertOpen(false);
    if (cmds === ""){
      cmds = [];
    }
    let originalCommands = cmds.slice();
    if (selectedIndex === -1){
      cmds.push(selectedCommand);
    } else {
      cmds[selectedIndex] = selectedCommand;
    }
    
    serverFunctions.saveCommands(cmds).then(function(rsp){
      if ('error' in rsp){
        setCommands(originalCommands);
        setAlertMessage(rsp.error);
        setAlertOpen(true);
      } else if ('response' in rsp) {
        setCommands(rsp.response);
      }
      setSaving(false);
    }).catch(function(err){
      console.log(err);
      setAlertMessage('Unable to save your commands. Please try again.');
      setAlertOpen(true);
      setSaving(false);
    });
  }

  function deleteCommand(idx) {
    let cmds = commands.slice();
    cmds.splice(idx, 1);
    saveCommands(cmds);
  }

  return (
    <div className={classes.root}>
      <div className="sidebar branding-below">
        {getting ? <CircularProgress />
        : editing ? <Edit selectedCommand={selectedCommand} setSelectedCommand={setSelectedCommand} newHeader={newHeader} setNewHeader={setNewHeader} saveNewHeader={saveNewHeader} commands={commands} saveCommands={saveCommands} saving={saving} setEditing={setEditing} setAlertMessage={setAlertMessage} />
        : (!commands || commands.length === 0) ? (
          <>
            <Typography variant="h6" gutterBottom>
            No saved data connections.
            </Typography>
            <Typography variant="body2" gutterBottom>
            The link to our documentation below has tons of examples to help get you started.
            </Typography>
            <NewCommandButton editing={editing} editCommand={editCommand} />
          </>
        ) : (
          <>
            <h4>My data connections</h4>
            {commands.length > 0 && commands.map((command, idx) => (
              <div key={idx} className="block">
                {(idx > 0) &&
                  <Divider className={classes.divider} />
                }
                <label><strong>{command.name}</strong></label><br />
                <Button
                  size="small"
                  className={classes.button}
                  startIcon={<DeleteIcon />}
                  disabled={saving} onClick={() => deleteCommand(idx)}
                >
                  Delete
                </Button>
                <Button
                  size="small"
                  className={classes.button}
                  startIcon={<EditIcon style={{color:'#3f8cb5'}} />}
                  disabled={editing || saving} onClick={() => editCommand(idx, command)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  className={classes.button}
                  startIcon={<DirectionsRun color='primary' />}
                  disabled={running || saving} 
                  onClick={() => runCommand(command.name)}
                >
                  Run
                </Button>
              </div>
            ))}
            <NewCommandButton editing={editing} editCommand={editCommand} />
          </>
        )}
      </div>
      <div className="sidebar bottom">
        <Button variant="contained" size="small" color='primary' className={classes.button} startIcon={<BookIcon />} href="https://dataconnector.app/docs/docs/" target="_blank" fullWidth style={{width:'95%'}}>Documentation</Button>
        <Button variant="contained" size="small" className={classes.button} startIcon={<GitHubIcon />} href="https://github.com/brentadamson/dataconnector" target="_blank" fullWidth style={{width:'95%'}}>Request a feature</Button>
        <Snackbar open={alertOpen} autoHideDuration={6000} onClose={handleAlertClose}>
          <Alert onClose={handleAlertClose} severity="error">
            {alertMessage}
          </Alert>
        </Snackbar>
      </div>      
    </div>
  );
};

function NewCommandButton(props){
  const classes = useStyles();
  return (
    <Button
      variant="contained"
      color='primary'
      size="small"
      className={classes.button}
      startIcon={<AddIcon />}
      disabled={props.editing} onClick={() => props.editCommand(-1, {"name":"my command","command":{"type":"direct","command":{"headers":[],"url":""}},"filter":{"type":"jmespath","filter":{"expression":""}}})}
    >
      New command
    </Button>
  )
}

