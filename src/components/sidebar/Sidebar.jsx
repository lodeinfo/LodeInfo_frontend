import React from "react";
import { Layout, Flex } from "antd";
import SidebarTop from "./SidebarTop";
import SidebarMiddle from "./SidebarMiddle";
import SidebarBottom from "./SidebarBottom";

const { Sider } = Layout;

function Sidebar(props) {
    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={props.collapsed}
            width={260}
            collapsedWidth={72}
            className="gemini-sider"
        >
            <Flex vertical className="sidebar-flex">
                <SidebarTop {...props} />
                <SidebarMiddle {...props} />
                <SidebarBottom {...props} />
            </Flex>
        </Sider>
    );
}

export default Sidebar;
