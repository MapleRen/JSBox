var body = $response.body

//BundleDependency_DoNotUse
body.replace('BundleDependency_DoNotUse','');
$done(body);
