const path = require('path');
const router = require('koa-router');
const DBTool = require('../com/DBTool/DBTool.js');
const getServerInfo = require('../lib/getServerInfo.js');
const configTool = require('../com/configTool.js');
const FSTool = require('../lib/FSTool/index.js');
const {openDB, reConnect, closeAll} = require('../com/DBTool/DBConnectTool.js');
const ManageRoutes = new router({prefix: '/manage'});

ManageRoutes
    .get('/getServerInfo', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let ServerInfo = getServerInfo();
        await configTool.init();
        ServerInfo.appBasePath = configTool.appBasePath;
        ctx.body = JSON.stringify(ServerInfo);
    })
    .get('/getServerConfig', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        await configTool.init();
        let config = configTool.config;
        ctx.body = JSON.stringify(config);
    })
    .get('/getWinUIAuth', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        ctx.body = JSON.stringify({WinUIAuth: configTool.config.WinUIAuth || '', message: 'WinUI授权令牌'});
    })
    .get('/updateWinUIAuth', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {WinUIAuth} = ctx.request.query;
        if (!WinUIAuth) {
            ctx.body = JSON.stringify({editRes: false, message: '参数缺失：WinUIAuth'});
        } else {
            let editRes = await configTool.editConfig('WinUIAuth', WinUIAuth);
            console.log(editRes);
            editRes && (ctx.body = JSON.stringify({editRes: true, message: 'WinUIAuth 授权令牌更新成功，重启服务端后生效'}));
            !editRes && (ctx.body = JSON.stringify({editRes: false, message: 'WinUIAuth 授权令牌，更新失败'}));
        }
    })
    .get('/scanPath', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {path} = ctx.request.query;
        let fileCount = (await FSTool.getFilePathList(path)).length;
        ctx.body = JSON.stringify({fileCount});
    })
    .get('/getDBInfoList', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let fileInfoList = await DBTool.getDBInfoList() || [];
        ctx.body = JSON.stringify(fileInfoList);
    })
    .get('/getDBPathTree', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName} = ctx.request.query;
        let dbTool = await openDB(DBName);
        let res = await dbTool.getDBPathTree();
        ctx.body = JSON.stringify(res);
    })
    .get('/getFileListByPath', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName, path} = ctx.request.query;
        let dbTool = await openDB(DBName);
        let res = await dbTool.getDirListByPath(path);
        ctx.body = JSON.stringify(res);
    })
    .get('/getDirInfo', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName, dirPath} = ctx.request.query;
        let dbTool = await openDB(DBName);
        let res = await dbTool.getDirInfo(dirPath);
        ctx.body = JSON.stringify(res);
    })
    .get('/createDB', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName, targetDirectory, mataData} = ctx.request.query;
        if (mataData) {
            mataData = JSON.parse(mataData);
        }
        let msg = await DBTool.createDB(DBName, targetDirectory, mataData);
        ctx.body = JSON.stringify({msg});
    })
    .get('/appendFile', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName, targetDirectory, currentDirectory} = ctx.request.query;
        let msg = await DBTool.appendFile(DBName, targetDirectory, currentDirectory);
        await reConnect(DBName);
        ctx.body = JSON.stringify({msg});
    })
    .get('/clearFileDate', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName} = ctx.request.query;
        let dbTool = await openDB(DBName);
        await reConnect(DBName);
        let res = await dbTool.clearFileDate();
        ctx.body = JSON.stringify(res);
    })
    .get('/wipeCache', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName} = ctx.request.query;
        let dbTool = await openDB(DBName);
        await reConnect(DBName);
        let res = await dbTool.wipeCache();
        ctx.body = JSON.stringify(res);
    })
    .get('/setMataData', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName, mataData} = ctx.request.query;
        let dbTool = await openDB(DBName);
        if (mataData) {
            mataData = JSON.parse(mataData);
        }
        let msg = await dbTool.setMataData(mataData);
        ctx.body = JSON.stringify({msg});
    })
    .get('/deleteByFullPath', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName, fullPath} = ctx.request.query;
        let dbTool = await openDB(DBName);
        await reConnect(DBName);
        let res = await dbTool.deleteByFullPath(fullPath);
        ctx.body = JSON.stringify(res);
    })
    .get('/deleteByDir', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName, directory} = ctx.request.query;
        let dbTool = await openDB(DBName);
        await reConnect(DBName);
        let res = await dbTool.deleteByDir(directory);
        ctx.body = JSON.stringify(res);
    })
    .get('/exportDB', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName, targetDirectory} = ctx.request.query;
        let res = await DBTool.exportDB(DBName, targetDirectory);
        ctx.body = JSON.stringify({res});
    })
    .get('/deleteDB', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName} = ctx.request.query;
        if (DBName) {
            await closeAll();
            let result = await DBTool.deleteDB(DBName);
            ctx.body = JSON.stringify({result});
        } else {
            ctx.status = 404;
        }
    })
    .get('/getFileBySearch', async (ctx: any) => {
        ctx.set('Content-Type', 'application/json;charset=utf-8');
        let {DBName, text} = ctx.request.query;
        if (DBName && text) {
            let dbTool = await openDB(DBName);
            let list = await dbTool.getFileListBySearch(text);
            list.map((item: any) => item.ext = path.extname(item.file_name));
            ctx.body = JSON.stringify(list);
        } else {
            ctx.status = 404;
        }
    });

export = ManageRoutes;
