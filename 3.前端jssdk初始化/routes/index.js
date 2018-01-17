var express = require('express');
var router = express.Router();
const crypto = require('crypto');
const jssdk = require('../libs/jssdk');

/* GET home page. */
router.get('/wechat/hello', function(req, res, next) {
	jssdk.getSignPackage(`http://weixintoken.free.ngrok.cc${req.url}`, function(err, signPackage){
			if(err){
				return next(err);
			}
		
		 //jade Template
		 	res.render('index', {
		 		title: 'Hello Wechat from Major’s PC',
		 		signPackage: signPackage,
		 		pretty: true
		 	});
	})
});

const token = 'majortoken';

//将方法封装 相应get post响应
const handleWechatRequest = function(req, res, next) {  
	const {signature, timestamp, nonce, echostr} = req.query;
	if(!signature || !timestamp || !nonce ){
		return res.send('Invalid request');
	}
	
	if(req.method === 'POST'){
		console.log('handleWechatRequest.post:', {body: req.body, query: req.query});
	}
	
	if(req.method === 'GET'){
		console.log('handleWechatRequest.get:', {body: req.body});
		if(!echostr){ //get方法校验 echostr 是否为空
			return res.send('Invalid request');
		}
	}
	
	//将token, timestamp, nonce三个参数进行字典排序
	const params = [token, timestamp, nonce];
	params.sort();
	
	//将三个字符串拼成一个字符串进行sha1加密
	const hash = crypto.createHash('sha1');
	const sign = hash.update(params.join('')).digest('hex');
	
	//开发者获得加密后的字符串与signature进行对比
	if(signature === sign){
		/*验证通过后判断请求类型 做相应响应操作*/
		if(req.method === 'GET'){
			console.log(echostr);
			res.send(echostr ? echostr : 'Invalid request');
		}else{
			const tousername = req.body.xml.tousername[0].toString();
			const fromusername = req.body.xml.fromusername[0].toString();
//		const createtime = req.body.xml.createtime[0].toString();
			const createtime = Math.round(Date.now() / 1000);
			const msgtype = req.body.xml.msgtype[0].toString();
			const content = req.body.xml.content[0].toString();
			const msgid = req.body.xml.msgid[0].toString();
			
			console.log('消息来自：'+fromusername+'的消息'+content+';发送给'+tousername);
			
			const response = `<xml>
			<ToUserName><![CDATA[${fromusername}]]></ToUserName>
			<FromUserName><![CDATA[${tousername}]]></FromUserName>
			<CreateTime>${createtime}</CreateTime>
			<MsgType><![CDATA[${msgtype}]]></MsgType>
			<Content><![CDATA[${content}]]></Content>
			</xml>`;
			res.send(response);
		}
	}else{
		res.send('Invalid sign');
	}
	
}

router.get('/api/wechat', handleWechatRequest);
router.post('/api/wechat', handleWechatRequest);

module.exports = router;
