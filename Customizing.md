# Customizing the ZigBee Site Survey Tool

Feel free to customize this tool with your own logo, favicon and CSS rules. You can either do this by changing the
source code manually (and merge all changes when there is an update) or you can achieve this easier by using the 
functionality described below.

When customizing this tool, please provide a valid support address for your customers. I won't support this tool
for you.

When starting up the tool tries to load the settings.json file in the /public/custom folder (this folder is not part
of this project). If the file is found, the settings are parsed and used.

## Settings
### enabled
The "main switch" enabling the template. See the original version by setting this value to _false_. If omitted, the
default value is _true_.

### title
Override the app name displayed in the title and the web browser tab.

### texts
Use your own translation for the tool. Just use the same JSON structure as you find in texts.js. If the path (relative to public) is not defined, the built-in languages will be used.

### css
Define the path to your CSS stylesheet. This is the path as used from the web browser.

### useOwnAboutDialog
Use your own about dialog by setting this value to _true_. If set to true, the file _about.jade_ in the custom folder
is parsed and displayed instead of the original about dialog.

### logo
Define the logo to be displayed here.

### faviconPath
Define the path where your favicons reside. Create them with [http://realfavicongenerator.net/](http://realfavicongenerator.net) 
so you get exactly the files needed by the template.

### devices
If you have a device identified by the first bytes of the MAC address, you can add a label which is displayed when a
device with a matching MAC address was found. Group the address into four character groups as shown in the sample below.

## Sample settings.js
    {
      "enabled": true,
      "css": "/custom/kaba.css",
      "useOwnAboutDialog": true,
      "faviconPath": "/custom/favicon",
      "logo": "/custom/Kaba_Tagline_Bottom_RGB.png",
      "devices": [
        {
          "macAddress": "0015 BC",
          "label": "Kaba Gateway"
        },
        {
          "macAddress": "2F9Ex",
          "label": "Philips Hue"
        }
      ],
      "title": "ZigBee Site Survey",
      "texts": "/custom/texts.json"
    }

