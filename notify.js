const WindowsToaster = require('node-notifier').WindowsToaster
const request = require('request')
const path = require('path')
const childProc = require('child_process')
const chalk = require('chalk')
const config = require('./config')

const log = console.log
const endpoint = config.GetEndPoint()
const now = new Date()

let previousValue
let url = endpoint + "M_ProfitProjectPOA"

const notifier = new WindowsToaster({
	withFallback: false,
	customPath: void 0
});

const options = {
	url: url,
	headers: {
		Authorization: 'Bearer ' + config.GetBearerToken()
	}
}

function HandleError(err) {
	log(chalk.red(JSON.stringify(err, null, 2)));	
}

function makeCall() {
    request(options, function (err, data) {
        if (err) {
            log(chalk.red(err));
        } else {
			log(chalk.green(JSON.stringify(data, null, 2)))
			jsonReponse = JSON.parse(data.body)
			log('prev: ' + previousValue)
			log('SbId: ' + jsonReponse.result.SbId)
			if (jsonReponse.result.SbId == previousValue) {
				return	
			} else {
				previousValue = jsonReponse.result.SbId
				
				// Triggers if `wait: true` and user clicks notification
				notifier.on('click', function (notifierObject, options) {
					childProc.exec('start "Google Chrome" https://32772.afasinsite.nl/productontwikkeling?SbId=' + options.param, function(err, stdout, stderr) {
						if (err) HandleError(err)
					});
				});
				
				// Triggers if `wait: true` and notification closes
				notifier.on('timeout', function (notifierObject, options) {
				});

				notifier.notify({
					title: "POA (Prio " + jsonReponse.result.Prioriteit + ")",
					icon: path.join(__dirname, 'afas.png'),
					message: jsonReponse.result.Onderwerp,
					sound: true,
					wait: true, // Wait with callback, until user action is taken against notification
					param: jsonReponse.result.SbId
				}, function (err, response) {
					// Response is response from notification
					if (err) HandleError(err)
				});
			}
        }
    });
	
	setTimeout(function () {
		makeCall();
	}, 60 * 1000);
	
}

log('Gestart om ' + now.getHours() + ":" + now.getMinutes())
makeCall()
