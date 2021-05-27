import React, { useState, useEffect } from 'react';
import server from '../../utils/server';
const { serverFunctions } = server;
import { makeStyles } from '@material-ui/core/styles';
import Divider from '@material-ui/core/Divider';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import { loadCSS } from 'fg-loadcss';
import Icon from '@material-ui/core/Icon';
import StarIcon from '@material-ui/icons/Star';
import FacebookIcon from '@material-ui/icons/Facebook';
import TwitterIcon from '@material-ui/icons/Twitter';
import InstagramIcon from '@material-ui/icons/Instagram';
import LinkedInIcon from '@material-ui/icons/LinkedIn';
import RedditIcon from '@material-ui/icons/Reddit';
import YouTubeIcon from '@material-ui/icons/YouTube';
import LaptopIcon from '@material-ui/icons/Laptop';

const useStyles = makeStyles((theme) => ({
  root: {
    display: 'flex',
    '& > * .fa': {
      margin: theme.spacing(2),
      marginLeft: theme.spacing(0),
    },
  },
  button: {
    margin: theme.spacing(1),
    marginLeft: theme.spacing(0),
  },
  divider: {
    backgroundColor: 'red',
    width: '100%',
    marginBottom: theme.spacing(1),
  },
  link: {
    textDecoration: 'none',
  }
}));

export default function Promotions(props) {
  const classes = useStyles();
  const [promos, setPromos] = useState({});

  useEffect(() => {
    serverFunctions.getPromotions().then(function (rsp) {
      if ('response' in rsp && 'show' in rsp.response && rsp.response.show === true) {
        setPromos({ ...rsp.response });
      }
    }).catch(function (err) {
      console.log('Unable to get promotions: ' + err);
    });

    // load font awesome
    const node = loadCSS(
      'https://use.fontawesome.com/releases/v5.12.0/css/all.css',
      document.querySelector('#font-awesome-css'),
    );

    return () => {
      node.parentNode.removeChild(node);
    };
  }, []);

  return (
    <div className={classes.root}>
      {Object.keys(promos).length ?
        <Grid container spacing={1}>
          <Grid item xs={1}>
            <Icon className="fa fa-bullhorn" color="secondary" />
          </Grid>
          <Grid item xs={11}>
            <Typography variant="h3">
              Enjoying Data Connector?
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="h4" gutterBottom>
              Let's add some more free to your free tier!
            </Typography>
          </Grid>

          <Grid item xs={12} style={{marginBottom: '20px'}}>
            <Typography variant="subtitle1" gutterBottom>
              Our free tier lets you run {promos.default} saved command. Get 4 more for free (for a total of {promos.default + promos.review + promos.social + promos.blog}) by completing 1 or more of the following. Once any or all of them are completed, email us at <a className={classes.link} target="_blank" href="mailto:support@dataconnector.app">support@dataconnector.app</a>.
            </Typography>
          </Grid>

          {promos.review > 0 ? (
            <>
              <Divider className={classes.divider} />
              <Grid item xs={12}>
                <StarIcon color='primary' fontSize='large' />
                <StarIcon color='primary' fontSize='large' />
                <StarIcon color='primary' fontSize='large' />
                <StarIcon color='primary' fontSize='large' />
                <StarIcon color='primary' fontSize='large' />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6">
                  Leave us an awesome 5-star review on <a target="_blank" href="https://workspace.google.com/marketplace/app/appname/529655450076">our Google Workspace Marketplace page</a>
                </Typography>
              </Grid>              
              <Grid item xs={12}>
                <Typography variant="body1" gutterBottom>{promos.review} additional command{promos.review>1 ? 's': ''}</Typography>
              </Grid>
            </>) : ''
          }

          {promos.social > 0 ? (            
            <>
              <Divider className={classes.divider} />
              <Grid item xs={12}>
                <a target="_blank" href="https://www.facebook.com/"><FacebookIcon style={{ color: '#4267B2' }} fontSize='large' /></a>
                <a target="_blank" href="https://twitter.com/home"><TwitterIcon style={{ color: '#1DA1F2' }} fontSize='large' /></a>
                <a target="_blank" href="https://www.linkedin.com/feed/"><LinkedInIcon style={{ color: '#2867B2' }} fontSize='large' /></a>
                <a target="_blank" href="https://www.instagram.com/"><InstagramIcon style={{ color: '#E1306C' }} fontSize='large' /></a>
                <a target="_blank" href="https://www.reddit.com/"><RedditIcon style={{ color: '#FF4500' }} fontSize='large' /></a>
              </Grid>
              <Grid item xs={12} style={{ paddingTop: '0px' }}>
                <Typography variant="h6">
                  Tell your followers on 1 or more social media platforms how much you love Data Connector! Make sure to either tag us or include a link to our homepage at https://dataconnector.app
                </Typography>
              </Grid>              
              <Grid item xs={12} style={{ paddingTop: '0px' }}>
                <Typography variant="body1" gutterBottom>{promos.social} additional command{promos.social>1 ? 's': ''}</Typography>
              </Grid>
            </>) : ''
          }

          {promos.blog > 0 ? (            
            <>
              <Divider className={classes.divider} />
              <Grid item xs={12}>
                <a target="_blank" href="https://www.youtube.com/"><YouTubeIcon style={{ color: '#FF0000' }} fontSize='large' /></a>
                <LaptopIcon style={{ color: '#7d7d7d' }} fontSize='large' />
              </Grid>
              <Grid item xs={12} style={{ paddingTop: '0px' }}>
                <Typography variant="h6">
                  Write a blog post or make a YouTube video that includes how much you love Data Connector! It doesn't have to be long! Make sure to include a link to our homepage at https://dataconnector.app
                </Typography>
              </Grid>
              <Grid item xs={12} style={{ paddingTop: '0px' }}>
                <Typography variant="body1" gutterBottom>{promos.blog} additional command{promos.blog>1 ? 's': ''}</Typography>
              </Grid>
            </>) : ''
          }
        </Grid>
        : ''}
    </div>
  );
};
