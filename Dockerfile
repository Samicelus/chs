ARG SERVER_PORT
FROM ccr.ccs.tencentyun.com/rd-base/rd-base-node
RUN cp -f /usr/share/zoneinfo/Asia/Shanghai /etc/localtime
WORKDIR /home/consultModulation
COPY ./ .
RUN npm install --production --registry=https://registry.npm.taobao.org
EXPOSE ${SERVER_PORT}
CMD npm start