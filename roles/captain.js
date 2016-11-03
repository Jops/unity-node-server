var res = require('../helpers/cmdRes'),
	clMsg = require('../helpers/clientMsg'),
	common = require('./common');

var info = {
		'command-info': {
			name: 'command-info',
			params: '{string} optional specific command name',
			desc: '{JSON} command list / description.'
		},
		'crew-message': {
			name: 'crew-message',
			params: '{string} recipient name (lowercase), {string} message',
			desc: 'e.g. sends a message to the "captain".'
		}
	};

function infoBuilder( info )
{
	return {
		captainsIssues: 'some info.'
	};
}

module.exports =
{
	'command-info': function( data )
	{
		return common.commandInfo( 'captain', info, data );
	},

	'crew-message': function( data )
	{
		return common.crewMessage( 'message-from-captain', data );
	},

	// server specific command
	buildClientInfo: infoBuilder
};