var commands = require('config').roles.captain;

module.exports =
{
	'command-list': function()
	{
		return JSON.stringify( commands );
	},
	'do-captiony-stuff': function( data )
	{

	}
};