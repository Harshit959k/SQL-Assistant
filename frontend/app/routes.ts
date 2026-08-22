import { type RouteConfig, index, route } from "@react-router/dev/routes"

export default [
    index("routes/home.tsx"),
    route('/conversation', 'routes/conversation.tsx')
] satisfies RouteConfig
