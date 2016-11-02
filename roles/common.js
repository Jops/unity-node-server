var res = require('../helpers/cmdRes'),
	clMsg = require('../helpers/clientMsg');

module.exports = {
	commandInfo: function( role, info, data )
	{
		return res(
			role,
			clMsg(
				'server-info',
				data ?
					info[ data[0] ] ? info[ data[0] ] : 'command unknown: ' + data[0] :
					Object.keys( info )
			)
		);
	},

	crewMessage: function( type, data )
	{
		return res( data[0], clMsg( type, data[1] ) );
	}
};