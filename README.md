#ZigBee Site Survey tool

A node.js tool for ZigBee range measurements using a RapidConnect USB stick from MMB Networks. This tool ist just a 
proof-of-concept an won't be maintained for a long time. If you want to build your own survey tool, just fork the project
and create your logic.

Github Page: http://ancasicolica.github.io/ZigBeeSiteSurvey/

## Installation

### Prerequisites
This tool requires a current node.js release and a ready to operate RapidConnect USB dongle. The tool was developed
and tested using Mac OS X and the Google Chrome browser 
but it should run on other operating systems and with other browsers (current releases of Firefox or Opera, but don't 
try Internet Explorer, i've warned you!!) as well.

### Step-by-step installation

* Install node.js if you don't have it already. You get the current release at nodejs.org
* Download the latest release of the ZigBee Survey Tool, extract it to a location of your choice
* Run _npm install_ in the folder where you extracted the sources. This will install the dependencies
* Install the drivers obtained from MMB Networks webpage for the USB dongle and attach it. For Windows get the COM port using the system tools.
* Enter the COM Port (Mac users should not have to do anything) in settings.js, _settings.serialport_. Windows users should use a modern text editor (as notepad shows the whole content in one line)

## Run the tool
Just start the tool using the command line 
     
     node server.js

If the environment variable SIMULATOR is set to true, simple simulated data is used. This mode enables debugging the UI without
a ZigBee network or hardware.

Open the URL supplied in the console in your web browser (defaults: simulator: http://localhost:2999, real: http://localhost:2998)

For the diagram the tool needs a network connection as the Google charts API has to be loaded. If there is no network connection,
the chart is not displayed (but the tool should still run).

## Usage
The first page shows the networks available, press the refresh button to scan again. If you select a network by clicking on its
PAN-ID, the second page opens with detailed data about the selected network and a continous scan mode.

Use the log field to enter some data (e.g. 'Room 201') and press the button right of the input. This logs the measurement and adds
it to the list. 

After finishing your survey, print the page (generate a PDF) and return to the main page by pressing the 'x' in the title bar.
  
## Configuration options
See settings.js for the options available. 

## Licence
MIT

