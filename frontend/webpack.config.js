const path=require('path');
const HtmlWebpackPlugin=require('html-webpack-plugin');
const MiniCssExtractPlugin=require('mini-css-extract-plugin');
const CopyWebpackPlugin=require('copy-webpack-plugin');
module.exports=(env,argv)=>{
 const production=argv.mode==='production';
 return {
  entry:'./src/main.jsx',
  output:{path:path.resolve(__dirname,'dist'),filename:production?'assets/[name].[contenthash:8].js':'assets/[name].js',publicPath:'/',clean:true},
  resolve:{extensions:['.js','.jsx']},
  devtool:production?false:'eval-cheap-module-source-map',
  module:{rules:[
   {test:/\.jsx?$/,exclude:/node_modules/,use:'babel-loader'},
   {test:/\.css$/,use:[production?MiniCssExtractPlugin.loader:'style-loader','css-loader']}
  ]},
  plugins:[
   new HtmlWebpackPlugin({template:'./public/index.html'}),
   new CopyWebpackPlugin({patterns:[{from:'public',to:'.',globOptions:{ignore:['**/index.html']}}]}),
   ...(production?[new MiniCssExtractPlugin({filename:'assets/[name].[contenthash:8].css'})]:[])
  ],
  devServer:{port:5173,historyApiFallback:true,hot:true,static:{directory:path.resolve(__dirname,'public'),publicPath:'/'},proxy:[{context:['/api'],target:'http://localhost:5000'}]},
  performance:{hints:false}
 };
};
