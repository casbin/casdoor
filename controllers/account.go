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
	"encoding/base64"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/casdoor/casdoor/object"
	"github.com/casdoor/casdoor/original"
	"github.com/casdoor/casdoor/util"
)

const (
	ResponseTypeLogin = "login"
	ResponseTypeCode  = "code"
)

type RequestForm struct {
	Type string `json:"type"`

	Organization string `json:"organization"`
	Username     string `json:"username"`
	Password     string `json:"password"`
	Name         string `json:"name"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Affiliation  string `json:"affiliation"`

	Application string `json:"application"`
	Provider    string `json:"provider"`
	Code        string `json:"code"`
	State       string `json:"state"`
	RedirectUri string `json:"redirectUri"`
	Method      string `json:"method"`
	WayOf2FA    string `json:"wayOf2FA"`

	EmailCode   string `json:"emailCode"`
	PhoneCode   string `json:"phoneCode"`
	PhonePrefix string `json:"phonePrefix"`
}

type Response struct {
	Status string      `json:"status"`
	Msg    string      `json:"msg"`
	Data   interface{} `json:"data"`
	Data2  interface{} `json:"data2"`
}

type HumanCheck struct {
	Type         string      `json:"type"`
	AppKey       string      `json:"appKey"`
	Scene        string      `json:"scene"`
	CaptchaId    string      `json:"captchaId"`
	CaptchaImage interface{} `json:"captchaImage"`
}

// @Title Signup
// @Description sign up a new user
// @Param   username     formData    string  true        "The username to sign up"
// @Param   password     formData    string  true        "The password"
// @Success 200 {object} controllers.Response The Response object
// @router /signup [post]
func (c *ApiController) Signup() {
	var resp Response

	if c.GetSessionUser() != "" {
		c.ResponseErrorWithData("Please sign out first before signing up", c.GetSessionUser())
		return
	}

	var form RequestForm
	err := json.Unmarshal(c.Ctx.Input.RequestBody, &form)
	if err != nil {
		panic(err)
	}

	application := object.GetApplication(fmt.Sprintf("admin/%s", form.Application))
	if !application.EnableSignUp {
		c.ResponseError("The application does not allow to sign up new account")
		return
	}

	if application.IsSignupItemEnabled("Email") {
		checkResult := object.CheckVerificationCode(form.Email, form.EmailCode)
		if len(checkResult) != 0 {
			c.ResponseError(fmt.Sprintf("Email%s", checkResult))
			return
		}
	}

	var checkPhone string
	if application.IsSignupItemEnabled("Phone") {
		checkPhone = fmt.Sprintf("+%s%s", form.PhonePrefix, form.Phone)
		checkResult := object.CheckVerificationCode(checkPhone, form.PhoneCode)
		if len(checkResult) != 0 {
			c.ResponseError(fmt.Sprintf("Phone%s", checkResult))
			return
		}
	}

	userId := fmt.Sprintf("%s/%s", form.Organization, form.Username)

	organization := object.GetOrganization(fmt.Sprintf("%s/%s", "admin", form.Organization))
	msg := object.CheckUserSignup(application, organization, form.Username, form.Password, form.Name, form.Email, form.Phone, form.Affiliation)
	if msg != "" {
		c.ResponseError(msg)
		return
	}

	id := util.GenerateId()
	if application.GetSignupItemRule("ID") == "Incremental" {
		lastUser := object.GetLastUser(form.Organization)
		lastIdInt := util.ParseInt(lastUser.Id)
		id = strconv.Itoa(lastIdInt + 1)
	}

	username := form.Username
	if !application.IsSignupItemVisible("Username") {
		username = id
	}

	user := &object.User{
		Owner:             form.Organization,
		Name:              username,
		CreatedTime:       util.GetCurrentTime(),
		Id:                id,
		Type:              "normal-user",
		Password:          form.Password,
		DisplayName:       form.Name,
		Avatar:            organization.DefaultAvatar,
		Email:             form.Email,
		Phone:             form.Phone,
		Address:           []string{},
		Affiliation:       form.Affiliation,
		IsAdmin:           false,
		IsGlobalAdmin:     false,
		IsForbidden:       false,
		SignupApplication: application.Name,
		Properties:        map[string]string{},
	}

	affected := object.AddUser(user)
	if affected {
		original.AddUserToOriginalDatabase(user)
	}

	if application.HasPromptPage() {
		// The prompt page needs the user to be signed in
		c.SetSessionUser(user.GetId())
	}

	object.DisableVerificationCode(form.Email)
	object.DisableVerificationCode(checkPhone)

	util.LogInfo(c.Ctx, "API: [%s] is signed up as new user", userId)

	resp = Response{Status: "ok", Msg: "", Data: userId}
	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title Logout
// @Description logout the current user
// @Success 200 {object} controllers.Response The Response object
// @router /logout [post]
func (c *ApiController) Logout() {
	var resp Response

	user := c.GetSessionUser()
	util.LogInfo(c.Ctx, "API: [%s] logged out", user)

	c.SetSessionUser("")

	resp = Response{Status: "ok", Msg: "", Data: user}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title GetAccount
// @Description get the details of the current account
// @Success 200 {object} controllers.Response The Response object
// @router /get-account [get]
func (c *ApiController) GetAccount() {
	userId, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	var resp Response

	user := object.GetUser(userId)
	if user == nil {
		resp := Response{Status: "error", Msg: fmt.Sprintf("The user: %s doesn't exist", userId)}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	organization := object.GetOrganizationByUser(user)
	resp = Response{Status: "ok", Msg: "", Data: user, Data2: organization}

	c.Data["json"] = resp
	c.ServeJSON()
}

// @Title UploadAvatar
// @Description upload avatar
// @Param   avatarfile   formData    string  true        "The base64 encode of avatarfile"
// @Param   password     formData    string  true        "The password"
// @Success 200 {object} controllers.Response The Response object
// @router /upload-avatar [post]
func (c *ApiController) UploadAvatar() {
	userId, ok := c.RequireSignedIn()
	if !ok {
		return
	}

	var resp Response

	user := object.GetUser(userId)

	avatarBase64 := c.Ctx.Request.Form.Get("avatarfile")
	index := strings.Index(avatarBase64, ",")
	if index < 0 || avatarBase64[0:index] != "data:image/png;base64" {
		resp = Response{Status: "error", Msg: "File encoding error"}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}

	dist, _ := base64.StdEncoding.DecodeString(avatarBase64[index+1:])
	msg := object.UploadAvatar(user.GetId(), dist)
	if msg != "" {
		resp = Response{Status: "error", Msg: msg}
		c.Data["json"] = resp
		c.ServeJSON()
		return
	}
	user.Avatar = fmt.Sprintf("%s%s.png?time=%s", object.GetAvatarPath(), user.GetId(), util.GetCurrentUnixTime())
	object.UpdateUser(user.GetId(), user)
	resp = Response{Status: "ok", Msg: ""}
	c.Data["json"] = resp
	c.ServeJSON()
}

func (c *ApiController) GetHumanCheck() {
	c.Data["json"] = HumanCheck{Type: "none"}

	provider := object.GetDefaultHumanCheckProvider()
	if provider == nil {
		id, img := object.GetCaptcha()
		c.Data["json"] = HumanCheck{Type: "captcha", CaptchaId: id, CaptchaImage: img}
		c.ServeJSON()
		return
	}

	c.ServeJSON()
}
