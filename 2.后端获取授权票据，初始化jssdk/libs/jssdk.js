/* * 
  描述：jssdk后端获取签名
 auther: Major_
 time: 2017/12/10
 * */
const crypto = require('crypto');
const request = require('request');
const fs = require('fs');
const debug = require('debug')('jswechat:jssdk');

function JSSDK(appId, appSecret){
	this.appId = appId;
	this.appSecret = appSecret;
}

JSSDK.prototype = {
	getSignPackage: function(url, done) {
		const intance = this;
		this.getJsApiTicket(function(err, jsApiTiket){
				if(err){
					return done(err);
				}
			
				const timestamp = Math.round(Date.now() / 1000);
				const nonceStr = intance.createNonceStr();
				
				//生成签名
				const rowString = `jsapi_ticket=${jsApiTiket}&noncestr=${nonceStr}&timestamp=${timestamp}&url=${url}`;
				const hash = crypto.createHash('sha1');
				const signature = hash.update(rowString).digest('hex');
				
				done(null,{
					timestamp,
					url,
					signature,
					rowString,
					nonceStr,
					appId: intance.appId
				})
		})
	},
	
	getJsApiTicket: function(done) {
		const cacheFile = '.jsapitiket.json';
		const intance = this;
		const data = intance.readCacheFile(cacheFile);
		const time = Math.round(Date.now() / 1000);
		if(typeof data.expireTime === 'undefined' || data.expireTime < time){
			intance.getAccessToken(function(error, accessToken){
				if(error){
					debug('getJsApiTicket.token.error:', error);
					return done(error, null);
				}
				
				const url = `https://api.weixin.qq.com/cgi-bin/ticket/getticket?type=jsapi&access_token=${accessToken}`;
				request.get(url, function(err, res, body){
					if(err){
						debug('getJsApiTicket.request.error:', err, url);
						return done(err, null);
					}
					
					debug('getJsApiTicket.request.body:', body);
					
					try{
						const data = JSON.parse(body);
						
						intance.writeCacheFile(cacheFile, {
							expireTime: Math.round(Date.now() / 1000) + 7200,
							jsapiTicket: data.ticket,
						});
						
						done(null, data.ticket);
					}catch(e){
						//TODO handle the exception
						debug('getJsApiTicket.request.error:', err, url);
						done(e, null);
					}
				});
			});
		}else{
			done(null, data.jsapiTicket);
		}
	},
	
	getAccessToken: function(done) {
		const cacheFile = '.accesstoken.json';
		const intance = this;
		const data = intance.readCacheFile(cacheFile);
		const time = Math.round(Date.now() / 1000);
		if(typeof data.expireTime === 'undefined' || data.expireTime < time){
				const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
				request.get(url, function(err, res, body){
					if(err){
						debug('getAccessToken.request.error:', err, url);
						return done(err, null);
					}
					
					debug('getAccessToken.request.body:', body);
					
					try{
						const data = JSON.parse(body);
						
						intance.writeCacheFile(cacheFile, {
							expireTime: Math.round(Date.now() / 1000) + 7200,
							accesstoken: data.access_token,
						});
						
						done(null, data.access_token);
					}catch(e){
						//TODO handle the exception
						debug('getAccessToken.parse.error:', err, url);
						done(e, null);
					}
				});
		}else{
			done(null, data.accesstoken);
		}
	},
	
	//生成随机字符串
	createNonceStr: function() {
		const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
		const length = chars.length;
		let str = '';
		for (let i = 0; i<length; i++){
			str += chars.substr(Math.round(Math.random() * length), 1);
		}
		return str;
	},
	
	//fs读取文件中的缓存
	readCacheFile: function(filename) {
		try{
			return JSON.parse(fs.readFileSync(filename));
		} catch(e) {
			debug('read file %s failed: %s', filename, e);
		}
		
		return {};
	},
	
	//fs将缓存写入文件
	writeCacheFile: function(filename, data) {
		return fs.writeFileSync(filename, JSON.stringify(data));
	},
};

const sdk = new JSSDK('wxbb6f7634bb9f77bb', '23bcb20dab6543b2265379122cfa00cb');
sdk.getAccessToken(function(err, accessToken){
	console.log(arguments);
})
sdk.getJsApiTicket(function(err, accessToken){
	console.log(arguments);
})

sdk.getSignPackage('http://www.baidu.com', function(err, accessToken){
	console.log(arguments);
})

