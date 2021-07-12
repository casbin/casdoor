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

import {Col, Modal, Row, Input} from "antd";
import i18next from "i18next";
import React from "react";
import * as Setting from "./Setting"
import * as UserBackend from "./backend/UserBackend"
import {CountDownInput} from "./component/CountDownInput";
import * as Util from "./auth/Util";
import * as AuthBackend from "./auth/AuthBackend";

export const VerifyModal = (props) => {
  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [code, setCode] = React.useState("");
  let {buttonText, destType, coolDownTime, org, userId, addr, visible} = props;

  const handleCancel = () => {
    props.changeVisible({visible: false});
  }

  const handleOk = () => {
    if (code === "") {
      Setting.showMessage("error", i18next.t("code:Empty Code"));
      return;
    }
    setConfirmLoading(true);

    // userId: User.Owner/User.Name
    let values = {
      "wayOf2FA": destType,
      "organization": userId.split("/")[0],
      "username": userId.split("/")[1]
    };
    if (destType === "Email") {
      values["email"] = addr;
      values["emailCode"] = code;
    } else if (destType === "Phone") {
      values["phone"] = addr;
      values["phoneCode"] = code;
    }

    const oAuthParams = Util.getOAuthGetParameters();
    AuthBackend.login(values, oAuthParams)
      .then((res) => {
        if (res.status === 'ok') {
          Util.showMessage("success", i18next.t("login:" + "Logged in successfully"));
          window.location.reload();
        } else {
          Util.showMessage("error", `Failed to log in: ${res.msg}`);
        }
      })
  }

  return (
    <Row>
      <Modal
        maskClosable={false}
        title={buttonText}
        visible={visible}
        okText={i18next.t("forget:Verify")}
        cancelText={i18next.t("user:Cancel")}
        confirmLoading={confirmLoading}
        onCancel={handleCancel}
        onOk={handleOk}
        width={600}
      >
        <Col style={{margin: "0px auto 40px auto", width: 1000, height: 80}}>
          <Row style={{width: "100%", marginBottom: "20px"}}>
            <Input
              addonBefore={i18next.t("general:" + destType)}
              // only mast the phone except for the prefix
              placeholder={destType==="Email"?Setting.maskEmail(addr):Setting.maskPhone(addr)}
              disabled={true}
            />
          </Row>
          <Row style={{width: "100%", marginBottom: "20px"}}>
            <CountDownInput
              defaultButtonText={i18next.t("code:Send Code")}
              textBefore={i18next.t("code:Code You Received")}
              placeHolder={i18next.t("code:Enter your code")}
              onChange={setCode}
              onButtonClick={UserBackend.sendCode}
              onButtonClickArgs={[addr?.indexOf("@")!==-1?addr:addr.split("/")[1], destType?.toLowerCase(), org?.owner + "/" + org?.name]}
              coolDownTime={coolDownTime}
            />
          </Row>
        </Col>
      </Modal>
    </Row>
  )
}

export default VerifyModal;
