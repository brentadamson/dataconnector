import React, { useState, useEffect } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import server from '../../utils/server';
const { serverFunctions } = server;
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';
import MenuItem from '@material-ui/core/MenuItem';
import GitHubIcon from '@material-ui/icons/GitHub';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
  },
}));

// Edit an OAuth2 connection 
export default function OAuth2(props) {
  const classes = useStyles();
  const [activeConnections, setActiveConnections] = React.useState([]);

  const getOAuthConnections = () => {
    // get the active OAuth2 connections the user has
    serverFunctions.getOAuthConnections().then(function(connections){
      console.log("keys: "+JSON.stringify(connections));
      setActiveConnections([...Object.keys(connections)]);
    }).catch(function(err){
      console.log(err);
      props.setAlertMessage('unable to retrieve active oauth2 connections');
    });
  }

  useEffect(() => {
    // listen for callback messages from when users connect to OAuth2 services.
    // Note: don't remove this event listener in case the oauth doesn't succeed and the user tries again
    // couldn't get window.postMessage (or any of it's variants) to work. Hopefully the user has local storage for intercom to work ;).
    var intercom = Intercom.getInstance();
    intercom.on('oauthComplete', function(data){
      // refetch the authorized oauth apps
      getOAuthConnections();
    });

    getOAuthConnections();
  }, []);

  const handleOAuth2ProviderChange = (event) => {
    var selectedCommand = JSON.parse(JSON.stringify(props.selectedCommand));
    selectedCommand.command.command.provider = event.target.value;
    props.setSelectedCommand(selectedCommand);
  }

  function githubConnect(){
    serverFunctions.getAuthorizationUrl().then(function(authorizationUrl){
      const newWindow = window.open(authorizationUrl, 'GitHub', 'noopener,noreferrer');
      if (newWindow){
        newWindow.opener = null
      };
    }).catch(function(err){
      console.log(err);
      props.setAlertMessage('unable to connect to GitHub');
    });
  }

  const none = 'none';
  const github = 'github';

  return (
    <div className={ classes.root }>
      <TextField
        select
        label="OAuth2 Provider (optional)"
        onChange={handleOAuth2ProviderChange}
        size='small'
        fullWidth
        value={props.selectedCommand.command.command.provider ? props.selectedCommand.command.command.provider : ''}
        inputProps={{style: {fontSize: 12}}} InputLabelProps={{style: {fontSize: 12}}}
      >
        <MenuItem key={none} value="">None</MenuItem>
        <MenuItem key={github} value={github}>
          <Grid container spacing={3} container direction="row" alignItems="center">
            <Grid item xs={2}>
              <GitHubIcon />
            </Grid>
            <Grid item xs={5}>
              <Typography variant="body1">GitHub</Typography>
            </Grid>
            <Grid item xs={2}>
              <Button
                size="small"
                color={'primary'}
                disabled={activeConnections.includes(github)}
                onClick={githubConnect}
              >
              {activeConnections.includes(github) ? 'Connected':'Connect'}
              </Button>
            </Grid>
          </Grid>
        </MenuItem>
      </TextField> 
    </div>
  )
}
