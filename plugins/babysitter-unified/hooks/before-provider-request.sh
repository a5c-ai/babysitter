#!/bin/bash
HOOK_TYPE="before-provider-request" ADAPTER_NAME="${ADAPTER_NAME:?}" source "$(dirname "$0")/_base.sh"
