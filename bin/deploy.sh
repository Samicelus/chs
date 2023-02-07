#!/usr/bin/expect
set dockerclean "docker rmi \\\$\\\(docker\" \"images\" \"-f\" \"\\\"dangling=true\\\"\" \"-q\\\)"
set timeout 1200
set port [lindex $argv 0]
set url [lindex $argv 1]
set branch [lindex $argv 2]

#打印
puts "deploy.sh脚本运行"
puts "参数：port=$port, url=$url, branch=$branch"

spawn ssh -o "StrictHostKeyChecking no" -p $port $url 
expect "#"
send "docker pull $host:$branch \r"
send "cd /data/scripts \r"
send "docker-compose up -d \r"
send "eval $dockerclean \r"
send "exit \r"
send "exit \r"
expect eof