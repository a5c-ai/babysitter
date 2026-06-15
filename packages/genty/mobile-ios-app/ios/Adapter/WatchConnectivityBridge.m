#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(WatchConnectivityBridge, RCTEventEmitter)
RCT_EXTERN_METHOD(sendToWatch:(NSString *)payload
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
@end
