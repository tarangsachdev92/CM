#!/bin/bash

zipfilename=$1
appname=$2
target_path=$3
resource_group=$4
subscription=$5

ls -l
az account show
## Perform the deployments
az webapp deployment source config-zip --resource-group $resource_group --subscription $subscription --name $appname --src $zipfilename

# az webapp deploy --resource-group $resource_group --subscription $subscription --name $appname --src-path  $zipfilename --type zip --target-path $target_path
