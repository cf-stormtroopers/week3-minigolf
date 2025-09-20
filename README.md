# CloneFest | Stormtroopers | Week 3 - MiniGolf

Demo Video: https://youtu.be/xsGOBBrNPMM

## Installation Instructions

### With Docker

1. Clone the repository with:

    ```bash
    git clone https://github.com/cf-stormtroopers/week3-minigolf.git cf3
    ```

2. Navigate to the repository and run the application with:
    ```bash
    cd cf3
    docker compose up -d
    ```

### With Node

1. Clone the repository with:

    ```bash
    git clone https://github.com/cf-stormtroopers/week3-minigolf.git cf3
    ```

2. Navigate to the repository and install dependencies:

    ```bash
    cd cf3
    npm i
    ```

3. Start the server with:
    ```bash
    npm run serve
    ```

## Gameplay Instructions

Start page: Click on Level 1 or Level 2 to choose level (Levels have been implemented according to the shared github game)

Click on the ball and drag diametrically opposite to where you want to aim, drag further away from it to increase power.

Click outside of the ball and drag to move the camera to your liking.

### Other Controls

To Reset Level: R

To Go to Level 1: 1

To Go to Level 2: 2

To Go to main Menu: Click the home button

Strokes will be displayed once hole has been made.

Once the hole has been made, you can retry to get a better score or move on to the next level.
