<p align="center">
  <img src="https://www.pastepic.xyz/images/2019/02/03/Apollo-min9a6d9d1c30e77ffe.png" height="150" width="150"/>
  <h1 align="center">Apollo-Bot</h1>
  <p align="center" style="font-size: 0.5em">Never miss another performance from your favorite artist 🎟️</p>
</p>



[![dependencies Status](https://david-dm.org/greenkeeperio/flags/master/status.svg)](https://david-dm.org/greenkeeperio/flags/master)

Apollo is a chatbot that can find concerts near you.

### Features

🎤**See them Live.** Be the first to grab your tickets to the shows of your favorite artists.

🚫**No More Spam.** Apollo will not blow up your phone with stupid updates. Only see the information that your care about.

🔎**Discover New Artists.** By learning what you like best, Apollo can match you with bands that suit your taste.


### Development
Install dependencies and start the server.
```sh
$ npm install
$ npm run dev
```
Facebook's Messenger webhooks require HTTPS

You can tunnle traffic from the dev server to a free domain with [Serveo](https://serveo.net/)

Example
```sh
$ ssh -R myfreedomain:80:localhost:1337 serveo.net
```
