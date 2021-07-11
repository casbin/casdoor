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

import React, {Component} from 'react';
import './App.less';
import {Helmet} from "react-helmet";
import * as Setting from "./Setting";
import {DownOutlined, LogoutOutlined, SettingOutlined} from '@ant-design/icons';
import {Avatar, BackTop, Dropdown, Layout, Menu} from 'antd';
import {Link, Redirect, Route, Switch, withRouter} from 'react-router-dom'
import OrganizationListPage from "./OrganizationListPage";
import OrganizationEditPage from "./OrganizationEditPage";
import UserListPage from "./UserListPage";
import UserEditPage from "./UserEditPage";
import ProviderListPage from "./ProviderListPage";
import ProviderEditPage from "./ProviderEditPage";
import ApplicationListPage from "./ApplicationListPage";
import ApplicationEditPage from "./ApplicationEditPage";
import LdapListPage from "./LdapListPage";
import LdapEditPage from "./LdapEditPage";
import LdapSyncPage from "./LdapSyncPage";
import TokenListPage from "./TokenListPage";
import TokenEditPage from "./TokenEditPage";
import RecordListPage from "./RecordListPage";
import AccountPage from "./account/AccountPage";
import HomePage from "./basic/HomePage";
import CustomGithubCorner from "./CustomGithubCorner";

import * as Auth from "./auth/Auth";
import SignupPage from "./auth/SignupPage";
import ResultPage from "./auth/ResultPage";
import LoginPage from "./auth/LoginPage";
import SelfLoginPage from "./auth/SelfLoginPage";
import SelfForgetPage from "./auth/SelfForgetPage";
import ForgetPage from "./auth/ForgetPage";
import * as AuthBackend from "./auth/AuthBackend";
import AuthCallback from "./auth/AuthCallback";
import SelectLanguageBox from './SelectLanguageBox';
import i18next from 'i18next';
import PromptPage from "./auth/PromptPage";

const { Header, Footer } = Layout;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      classes: props,
      selectedMenuKey: 0,
      account: undefined,
      uri: null,
    };

    Setting.initServerUrl();
    Auth.initAuthWithConfig({
      serverUrl: Setting.ServerUrl,
      appName: "app-built-in",
      organizationName: "built-in",
    });
  }

  UNSAFE_componentWillMount() {
    Setting.setLanguage();
    this.updateMenuKey();
    this.getAccount();
  }

  componentDidUpdate() {
    // eslint-disable-next-line no-restricted-globals
    const uri = location.pathname;
    if (this.state.uri !== uri) {
      this.updateMenuKey();
    }
  }

  updateMenuKey() {
    // eslint-disable-next-line no-restricted-globals
    const uri = location.pathname;
    this.setState({
      uri: uri,
    });
    if (uri === '/') {
      this.setState({ selectedMenuKey: 0 });
    } else if (uri.includes('organizations')) {
      this.setState({ selectedMenuKey: 1 });
    } else if (uri.includes('users')) {
      this.setState({ selectedMenuKey: 2 });
    } else if (uri.includes('providers')) {
      this.setState({ selectedMenuKey: 3 });
    } else if (uri.includes('applications')) {
      this.setState({ selectedMenuKey: 4 });
    } else if (uri.includes('ldaps')) {
      this.setState({ selectedMenuKey: 5 });
    } else if (uri.includes('tokens')) {
      this.setState({ selectedMenuKey: 6 });
    } else if (uri.includes('signup')) {
      this.setState({ selectedMenuKey: 100 });
    } else if (uri.includes('login')) {
      this.setState({ selectedMenuKey: 101 });
    } else if (uri.includes('result')) {
      this.setState({ selectedMenuKey: 100 });
    } else {
      this.setState({ selectedMenuKey: -1 });
    }
  }

  getAccessTokenParam() {
    // "/page?access_token=123"
    const params = new URLSearchParams(this.props.location.search);
    const accessToken = params.get("access_token");
    return accessToken === null ? "" : `?accessToken=${accessToken}`;
  }

  getCredentialParams() {
    // "/page?username=abc&password=123"
    const params = new URLSearchParams(this.props.location.search);
    if (params.get("username") === null || params.get("password") === null) {
      return "";
    }
    return `?username=${params.get("username")}&password=${params.get("password")}`;
  }

  getUrlWithoutQuery() {
    // eslint-disable-next-line no-restricted-globals
    return location.toString().replace(location.search, "");
  }

  getAccount() {
    let query = this.getAccessTokenParam();
    if (query === "") {
      query = this.getCredentialParams();
    }
    if (query !== "") {
      window.history.replaceState({}, document.title, this.getUrlWithoutQuery());
    }
    AuthBackend.getAccount(query)
      .then((res) => {
        let account = null;
        if (res.status === "ok") {
          account = res.data;
          account.organization = res.data2;
        } else {
          if (res.msg !== "Please sign in first") {
            Setting.showMessage("error", `Failed to sign in: ${res.msg}`);
          }
        }

        this.setState({
          account: account,
        });
      });
  }

  logout() {
    this.setState({
      expired: false,
      submitted: false,
    });

    AuthBackend.logout()
      .then((res) => {
        if (res.status === 'ok') {
          this.setState({
            account: null
          });

          Setting.showMessage("success", `Logged out successfully`);

          Setting.goToLinkSoft(this, "/");
        } else {
          Setting.showMessage("error", `Failed to log out: ${res.msg}`);
        }
      });
  }

  onUpdateAccount(account) {
    this.setState({
      account: account
    });
  }

  handleRightDropdownClick(e) {
    if (e.key === '201') {
      this.props.history.push(`/account`);
    } else if (e.key === '202') {
      this.logout();
    }
  }

  renderAvatar() {
    if (this.state.account.avatar === "") {
      return (
        <Avatar style={{ backgroundColor: Setting.getAvatarColor(this.state.account.name), verticalAlign: 'middle' }} size="large">
          {Setting.getShortName(this.state.account.name)}
        </Avatar>
      )
    } else {
      return (
        <Avatar src={this.state.account.avatar} style={{verticalAlign: 'middle' }} size="large">
          {Setting.getShortName(this.state.account.name)}
        </Avatar>
      )
    }
  }

  renderRightDropdown() {
    const menu = (
      <Menu onClick={this.handleRightDropdownClick.bind(this)}>
        <Menu.Item key="201">
          <SettingOutlined />
          {i18next.t("account:My Account")}
        </Menu.Item>
        <Menu.Item key="202">
          <LogoutOutlined />
          {i18next.t("account:Logout")}
        </Menu.Item>
      </Menu>
    );

    return (
      <Dropdown key="200" overlay={menu} >
        <div className="ant-dropdown-link" style={{float: 'right', cursor: 'pointer'}}>
          {
            this.renderAvatar()
          }
          &nbsp;
          &nbsp;
          {Setting.isMobile() ? null : Setting.getShortName(this.state.account.displayName)} &nbsp; <DownOutlined />
          &nbsp;
          &nbsp;
          &nbsp;
        </div>
      </Dropdown>
    )
  }

  renderAccount() {
    let res = [];

    if (this.state.account === undefined) {
      return null;
    } else if (this.state.account === null) {
      // res.push(
      //   <Menu.Item key="100" style={{float: 'right', marginRight: '20px'}}>
      //     <Link to="/signup">
      //       {i18next.t("account:Sign Up")}
      //     </Link>
      //   </Menu.Item>
      // );
      // res.push(
      //   <Menu.Item key="101" style={{float: 'right'}}>
      //     <Link to="/login">
      //       {i18next.t("account:Login")}
      //     </Link>
      //   </Menu.Item>
      // );
    } else {
      res.push(this.renderRightDropdown());
    }

    return res;
  }

  renderMenu() {
    let res = [];

    if (this.state.account === null || this.state.account === undefined) {
      return [];
    }

    res.push(
      <Menu.Item key="0">
        <Link to="/">
          {i18next.t("general:Home")}
        </Link>
      </Menu.Item>
    );

    if (Setting.isAdminUser(this.state.account)) {
      res.push(
        <Menu.Item key="1">
          <Link to="/organizations">
            {i18next.t("general:Organizations")}
          </Link>
        </Menu.Item>
      );
      res.push(
        <Menu.Item key="2">
          <Link to="/users">
            {i18next.t("general:Users")}
          </Link>
        </Menu.Item>
      );
      res.push(
        <Menu.Item key="3">
          <Link to="/providers">
            {i18next.t("general:Providers")}
          </Link>
        </Menu.Item>
      );
      res.push(
        <Menu.Item key="4">
          <Link to="/applications">
            {i18next.t("general:Applications")}
          </Link>
        </Menu.Item>
      );
      res.push(
          <Menu.Item key="5">
            <Link to="/ldaps">
              {i18next.t("general:LDAPs")}
            </Link>
          </Menu.Item>
      );
      res.push(
        <Menu.Item key="6">
          <Link to="/tokens">
            {i18next.t("general:Tokens")}
          </Link>
        </Menu.Item>
      );
      res.push(
          <Menu.Item key="7">
            <Link to="/records">
              {i18next.t("general:Records")}
            </Link>
          </Menu.Item>
      );
    }
    res.push(
      <Menu.Item key="7" onClick={() => window.location.href = "/swagger"}>
        {i18next.t("general:Swagger")}
      </Menu.Item>
    );
    return res;
  }

  renderHomeIfLoggedIn(component) {
    if (this.state.account !== null && this.state.account !== undefined) {
      return <Redirect to='/' />
    } else {
      return component;
    }
  }

  renderLoginIfNotLoggedIn(component) {
    if (this.state.account === null) {
      return <Redirect to='/login' />
    } else if (this.state.account === undefined) {
      return null;
    }
    else {
      return component;
    }
  }

  isStartPages() {
    return window.location.pathname.startsWith('/login') ||
      window.location.pathname.startsWith('/signup') ||
      window.location.pathname === '/';
  }

  renderContent() {
    return (
      <div>
        <Header style={{ padding: '0', marginBottom: '3px'}}>
          {
            Setting.isMobile() ? null : (
              <Link to={"/"}>
                <div className="logo" />
              </Link>
            )
          }
          <Menu
            // theme="dark"
            mode={(Setting.isMobile() && this.isStartPages()) ? "inline" : "horizontal"}
            selectedKeys={[`${this.state.selectedMenuKey}`]}
            style={{ lineHeight: '64px' }}
          >
            {
              this.renderMenu()
            }
            {
              this.renderAccount()
            }
          </Menu>
        </Header>
        <Switch>
          <Route exact path="/result" render={(props) => this.renderHomeIfLoggedIn(<ResultPage {...props} />)}/>
          <Route exact path="/result/:applicationName" render={(props) => this.renderHomeIfLoggedIn(<ResultPage {...props} />)}/>
          <Route exact path="/" render={(props) => this.renderLoginIfNotLoggedIn(<HomePage account={this.state.account} {...props} />)}/>
          <Route exact path="/account" render={(props) => this.renderLoginIfNotLoggedIn(<AccountPage account={this.state.account} {...props} />)}/>
          <Route exact path="/organizations" render={(props) => this.renderLoginIfNotLoggedIn(<OrganizationListPage account={this.state.account} {...props} />)}/>
          <Route exact path="/organizations/:organizationName" render={(props) => this.renderLoginIfNotLoggedIn(<OrganizationEditPage account={this.state.account} {...props} />)}/>
          <Route exact path="/organizations/:organizationName/users" render={(props) => this.renderLoginIfNotLoggedIn(<UserListPage account={this.state.account} {...props} />)}/>
          <Route exact path="/users" render={(props) => this.renderLoginIfNotLoggedIn(<UserListPage account={this.state.account} {...props} />)}/>
          <Route exact path="/users/:organizationName/:userName" render={(props) => <UserEditPage account={this.state.account} {...props} />}/>
          <Route exact path="/providers" render={(props) => this.renderLoginIfNotLoggedIn(<ProviderListPage account={this.state.account} {...props} />)}/>
          <Route exact path="/providers/:providerName" render={(props) => this.renderLoginIfNotLoggedIn(<ProviderEditPage account={this.state.account} {...props} />)}/>
          <Route exact path="/applications" render={(props) => this.renderLoginIfNotLoggedIn(<ApplicationListPage account={this.state.account} {...props} />)}/>
          <Route exact path="/applications/:applicationName" render={(props) => this.renderLoginIfNotLoggedIn(<ApplicationEditPage account={this.state.account} {...props} />)}/>
          <Route exact path="/ldaps" render={(props) => this.renderLoginIfNotLoggedIn(<LdapListPage account={this.state.account} {...props} />)}/>
          <Route exact path="/ldap/:ldapId" render={(props) => this.renderLoginIfNotLoggedIn(<LdapEditPage account={this.state.account} {...props} />)}/>
          <Route exact path="/ldap/sync/:ldapId" render={(props) => this.renderLoginIfNotLoggedIn(<LdapSyncPage account={this.state.account} {...props} />)}/>
          <Route exact path="/tokens" render={(props) => this.renderLoginIfNotLoggedIn(<TokenListPage account={this.state.account} {...props} />)}/>
          <Route exact path="/tokens/:tokenName" render={(props) => this.renderLoginIfNotLoggedIn(<TokenEditPage account={this.state.account} {...props} />)}/>
          <Route exact path="/records" render={(props) => this.renderLoginIfNotLoggedIn(<RecordListPage account={this.state.account} {...props} />)}/>
        </Switch>
      </div>
    )
  }

  renderFooter() {
    // How to keep your footer where it belongs ?
    // https://www.freecodecamp.org/neyarnws/how-to-keep-your-footer-where-it-belongs-59c6aa05c59c/

    return (
      <Footer id="footer" style={
        {
          borderTop: '1px solid #e8e8e8',
          backgroundColor: 'white',
          textAlign: 'center',
        }
      }>
        <SelectLanguageBox/>
        Made with <span style={{color: 'rgb(255, 255, 255)'}}>❤️</span> by <a style={{fontWeight: "bold", color: "black"}} target="_blank" href="https://casbin.org" rel="noreferrer">Casbin</a>
      </Footer>
    )
  }

  isDoorPages() {
    return window.location.pathname.startsWith("/signup") ||
      window.location.pathname.startsWith("/login") ||
      window.location.pathname.startsWith("/callback") ||
      window.location.pathname.startsWith("/prompt") ||
      window.location.pathname.startsWith("/forget");
  }

  renderPage() {
    if (this.isDoorPages()) {
      return (
        <Switch>
          <Route exact path="/signup" render={(props) => this.renderHomeIfLoggedIn(<SignupPage {...props} />)}/>
          <Route exact path="/signup/:applicationName" render={(props) => this.renderHomeIfLoggedIn(<SignupPage {...props} onUpdateAccount={(account) => {this.onUpdateAccount(account)}} />)}/>
          <Route exact path="/login" render={(props) => this.renderHomeIfLoggedIn(<SelfLoginPage {...props} />)}/>
          <Route exact path="/signup/oauth/authorize" render={(props) => <LoginPage type={"code"} mode={"signup"} {...props} onUpdateAccount={(account) => {this.onUpdateAccount(account)}} />}/>
          <Route exact path="/login/oauth/authorize" render={(props) => <LoginPage type={"code"} mode={"signin"} {...props} onUpdateAccount={(account) => {this.onUpdateAccount(account)}} />}/>
          <Route exact path="/callback" component={AuthCallback}/>
          <Route exact path="/forget" render={(props) => this.renderHomeIfLoggedIn(<SelfForgetPage {...props} />)}/>
          <Route exact path="/forget/:applicationName" render={(props) => this.renderHomeIfLoggedIn(<ForgetPage {...props} />)}/>
          <Route exact path="/prompt" render={(props) => this.renderLoginIfNotLoggedIn(<PromptPage account={this.state.account} {...props} />)}/>
          <Route exact path="/prompt/:applicationName" render={(props) => this.renderLoginIfNotLoggedIn(<PromptPage account={this.state.account} onUpdateAccount={(account) => {this.onUpdateAccount(account)}} {...props} />)}/>
        </Switch>
      )
    }

    return (
      <div id="parent-area">
        <BackTop />
        <CustomGithubCorner />
        <div id="content-wrap">
          {
            this.renderContent()
          }
        </div>
        {
          this.renderFooter()
        }
      </div>
    );
  }

  render() {
    if (this.state.account === undefined || this.state.account === null) {
      return (
        <React.Fragment>
          <Helmet>
            <link rel="icon" href={"https://cdn.casbin.com/static/favicon.ico"} />
          </Helmet>
          {
            this.renderPage()
          }
        </React.Fragment>
      )
    }

    const organization = this.state.account.organization;
    return (
      <React.Fragment>
        <Helmet>
          <title>{organization.displayName}</title>
          <link rel="icon" href={organization.favicon} />
        </Helmet>
        {
          this.renderPage()
        }
      </React.Fragment>
    )
  }
}

export default withRouter(App);
