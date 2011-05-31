/** ActMap is a simple utility for converting json based social media feeds feeds to the activity stream format conformant with the activity strema json schema as
 * defined by https://github.com/activitystreams/json-schema/blob/master/activity.json
 * Each Entry in the actMap schema defines a set of rules which are activity templates that can be exppanded to produce compliant activity objects when matched
 * against items in the feeds to which they apply.
 * Simple Twitter and Facebook exmaples are included here, but more will be added soon
 * */
 
// schema for ActMap entries
var schema	= {
	name	: 'actMap',
	properties: { 
		feeds	: { type:'array', items: { type:'string', format:'url' } },
		match	: { type:'string', default:'[*]' },
		rules	: { $ref:'https://github.com/activitystreams/json-schema/blob/master/activity.json' }
	}
}

// Sample ActMap rules for Twitter and Facebook
var actMap = {	
	twitter:	{
		feeds:	[ 'http://api.twitter.com/version/statuses/user_timeline.json' ],
		match:	'[*]',
		rules: 	{
			id	:	'http://twitter.com/{user.screen_name}/statuses/{id}',
			actor:	{
				title : '{user.name}',
				id	  :	'http://twitter.com/{user.screen_name}'
			},
			target:	{ 
				id	:'http://twitter.com/{in_reply_to_screen_name}',
				objectType: 'https://github.com/activitystreams/json-schema/blob/master/objectTypes/person.json'
			},	
			verb:		'post',
			object:		{
				id		:	'{id}',
				objectType:	'https://github.com/activitystreams/json-schema/blob/master/objectTypes/status.json'
			},
			published: 	'{created_at}',
			provider: 	{	id:'{source}' },
			geo	:		{ latitude: '{coordinates.coordinates[0]}', longitude: '{coordinates.coordinates[1]}' },	
			icon:		{},	
			tags:		[],
			title:		'',
			content:	'{text}',
			url: 		'',
			links: 		[]
		}
	},
	facebook:	{
		feeds	: [	'https://graph.facebook.com/{username}/feed' ],
		match	: 	'data[*]',
		rules	: {
			id	:	 	'{actions[0].link}',
			published:	'{created_time}',
			actor: {
				id	: 	'{from.id}',
				title:	'{from.name}'
			},
			object:	{
				id:		'',
				objectType:'{type}.json'
			},
			verb:		'{type}',
			provider: {
				id:		'{application.id}',
				title:	'{application.name}',
			},
			title:		'{name}',
			geo:		'{geo}',
			icon:		'{icon}',
			tags:		[],
			content: 	'{description}',
			url:		'{link}',
			target:		{}
		}
	}		
}

// Main Function for expanding the rules template given a source activiy data object
// This function will only return activiy properties if the rule sucessfully matches properties of the source data.
var exp = function(temp, data) { 
	var val, res = true;
	var sub = function(str, ref) {
		if (val = eval('data.'+ ref)) return val;
		else throw 'no value'
	}
	if (typeof(temp) === 'number') res = temp;
	else if (typeof(temp) === 'string') {	
		try { 
			res = temp.replace(/\{(.*?)\}/g, sub);
		} catch(e) { 
			res = null;						
		}
	} else if (temp instanceof Array) {
		res = [];
		for (var key in temp) if (val = exp(temp[key], data)) res.push(val);
	} else {
		res = {};
		for (var key in temp) if (val = exp(temp[key], data)) res[key] = val;
	}
	if (typeof res == 'object') for (var key in res) return res;
	else return res;
}
