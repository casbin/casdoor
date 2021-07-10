// Copyright 2021 The casbin Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package controllers

import (
	"strings"

	"github.com/astaxie/beego"
	"github.com/casdoor/casdoor/object"
	"github.com/casdoor/casdoor/util"
)

type ApiController struct {
	beego.Controller
}

func (c *ApiController) GetSessionUser() string {
	user := c.GetSession("username")
	if user == nil {
		return ""
	}

	userId, _ := user.(string)
	if strings.Index(userId, "/") < 0 {
		return ""
	}

	userObj := object.GetUser(userId)
	if userObj == nil {
		return ""
	}

	// if user login expired, then clean the session and return an empty string
	if userObj.SigninExpireTime != "" && util.IsTimeExpired(userObj.SigninExpireTime) {
		userObj.SigninExpireTime = ""
		object.UpdateUserInternal(userId, userObj)
		c.SetSessionUser("")
		return ""
	}

	return user.(string)
}

func (c *ApiController) SetSessionUser(user string) {
	c.SetSession("username", user)
}

func wrapActionResponse(affected bool) *Response {
	if affected {
		return &Response{Status: "ok", Msg: "", Data: "Affected"}
	} else {
		return &Response{Status: "ok", Msg: "", Data: "Unaffected"}
	}
}
