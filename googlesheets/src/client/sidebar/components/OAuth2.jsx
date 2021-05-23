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
import { Icon, InlineIcon } from '@iconify/react';
import googleAnalytics from '@iconify-icons/mdi/google-analytics';
import youtubeIcon from '@iconify-icons/mdi/youtube';

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

  const none = 'none';
  // These names should match the services defined in Code.js
  const github = 'github';
  const googleAnalyticsReporting = 'google_analytics_reporting';
  const youtube = 'youtube';

  function oauthConnect(service){
    if(activeConnections.includes(service)){
      serverFunctions.oauthSignOut(service).then(function(){
        getOAuthConnections();
      }).catch(function(err){
        console.log(err);
      });
    } else {
      serverFunctions.getAuthorizationUrl(service).then(function(authorizationUrl){
        const newWindow = window.open(authorizationUrl, service, 'noopener,noreferrer');
        if (newWindow){
          newWindow.opener = null
        };
      }).catch(function(err){
        console.log(err);
        props.setAlertMessage('unable to connect to '+service);
      });
    }
  }

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
        <MenuItem key={googleAnalyticsReporting} value={googleAnalyticsReporting}>
          <Grid container spacing={3} container direction="row" alignItems="center">
            <Grid item xs={1}>
              <Icon icon={googleAnalytics} />
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body1">Google Analytics Reporting</Typography>
            </Grid>
            <Grid item xs={12} style={{paddingTop:'0px'}}>
              <Button
                size="small"
                color={activeConnections.includes(googleAnalyticsReporting) ? 'default':'primary'}
                onClick={() => oauthConnect(googleAnalyticsReporting)}
              >
              {activeConnections.includes(googleAnalyticsReporting) ? 'Disconnect':'Connect'}
              </Button>
            </Grid>
          </Grid>
        </MenuItem>
        <MenuItem key={github} value={github}>
          <Grid container spacing={3} container direction="row" alignItems="center">
            <Grid item xs={2}>
              <GitHubIcon />
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body1">GitHub</Typography>
            </Grid>
            <Grid item xs={2}>
              <Button
                size="small"
                color={activeConnections.includes(github) ? 'default':'primary'}
                onClick={() => oauthConnect(github)}
              >
              {activeConnections.includes(github) ? 'Disconnect':'Connect'}
              </Button>
            </Grid>
            <Grid item xs={2}></Grid>
          </Grid>
        </MenuItem>
        <MenuItem key={youtube} value={youtube}>
          <Grid container spacing={3} container direction="row" alignItems="center">
            <Grid item xs={2}>
              <Icon icon={youtubeIcon} />
            </Grid>
            <Grid item xs={4}>
              <Typography variant="body1">YouTube</Typography>
            </Grid>
            <Grid item xs={2}>
              <Button
                size="small"
                color={activeConnections.includes(youtube) ? 'default':'primary'}
                onClick={() => oauthConnect(youtube)}
              >
              {activeConnections.includes(youtube) ? 'Disconnect':'Connect'}
              </Button>
            </Grid>
          </Grid>
        </MenuItem>
      </TextField> 
    </div>
  )
}
